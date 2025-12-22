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

    // Decline invite
    await prisma.gameInvite.update({
      where: { id: inviteId },
      data: { status: 'DECLINED' }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error declining invite:', error)
    }
    return NextResponse.json(
      { error: 'Ошибка отклонения приглашения' },
      { status: 500 }
    )
  }
}

