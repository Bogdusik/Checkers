import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { inviteId } = body

    if (!inviteId) {
      return NextResponse.json({ error: 'Не указано приглашение' }, { status: 400 })
    }

    // Get invite
    const invite = await prisma.gameInvite.findUnique({
      where: { id: inviteId }
    })

    if (!invite) {
      return NextResponse.json({ error: 'Приглашение не найдено' }, { status: 404 })
    }

    if (invite.toUserId !== user.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    if (invite.status !== 'PENDING') {
      return NextResponse.json({ error: 'Приглашение уже обработано' }, { status: 400 })
    }

    // Decline invite - use transaction to handle potential race conditions
    try {
      await prisma.$transaction(async (tx) => {
        // Double-check invite status
        const currentInvite = await tx.gameInvite.findUnique({
          where: { id: inviteId }
        })

        if (!currentInvite) {
          throw new Error('Приглашение не найдено')
        }

        if (currentInvite.status !== 'PENDING') {
          throw new Error('Приглашение уже обработано')
        }

        if (currentInvite.toUserId !== user.id) {
          throw new Error('Нет доступа')
        }

        // Update status - this should work now without unique constraint error
        await tx.gameInvite.update({
          where: { id: inviteId },
          data: { status: 'DECLINED' }
        })
      })

      return NextResponse.json({ success: true })
    } catch (txError: any) {
      // If transaction fails, throw to outer catch
      throw txError
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error declining invite:', error)
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        meta: error?.meta
      })
    }
    
    // Check for specific Prisma errors
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ошибка обновления приглашения. Попробуйте еще раз.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || 'Ошибка отклонения приглашения' },
      { status: 500 }
    )
  }
}

