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

    // Get all users except current user
    // Consider users online if they logged in within last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    const players = await prisma.user.findMany({
      where: {
        id: { not: user.id }
      },
      select: {
        id: true,
        username: true,
        email: true,
        lastLoginAt: true,
        statistics: {
          select: {
            totalGames: true,
            wins: true,
            losses: true
          }
        }
      },
      orderBy: {
        lastLoginAt: 'desc'
      }
    })

    // Mark players as online/offline
    const playersWithStatus = players.map(player => ({
      ...player,
      isOnline: player.lastLoginAt && new Date(player.lastLoginAt) > fiveMinutesAgo
    }))

    return NextResponse.json({ players: playersWithStatus })
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json(
      { error: 'Ошибка получения списка игроков' },
      { status: 500 }
    )
  }
}

