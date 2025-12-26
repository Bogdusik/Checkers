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

    const { inviteId } = await request.json()
    if (!inviteId) {
      return NextResponse.json({ error: 'Не указано приглашение' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      const invite = await tx.gameInvite.findUnique({ where: { id: inviteId } })
      
      if (!invite || String(invite.toUserId) !== String(user.id) || invite.status !== 'PENDING') {
        throw new Error('Приглашение недоступно')
      }

      await tx.gameInvite.update({
        where: { id: inviteId },
        data: { status: 'DECLINED' }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.message === 'Приглашение недоступно') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ошибка отклонения приглашения' }, { status: 500 })
  }
}
