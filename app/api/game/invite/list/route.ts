import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const invites = await prisma.gameInvite.findMany({
      where: {
        toUserId: user.id,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      },
      include: {
        fromUser: { select: { id: true, username: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ invites })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения приглашений' }, { status: 500 })
  }
}
