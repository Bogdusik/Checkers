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

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)
    const players = await prisma.user.findMany({
      where: { id: { not: user.id } },
      select: {
        id: true,
        username: true,
        email: true,
        lastLoginAt: true,
        statistics: { select: { totalGames: true, wins: true, losses: true } }
      },
      orderBy: { lastLoginAt: 'desc' }
    })

    const playersWithStatus = players.map(player => ({
      ...player,
      isOnline: player.lastLoginAt && new Date(player.lastLoginAt) > twoMinutesAgo
    }))

    return NextResponse.json({ players: playersWithStatus })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения списка игроков' }, { status: 500 })
  }
}
