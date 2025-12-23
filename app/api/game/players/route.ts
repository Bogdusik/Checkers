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

    // Update current user's lastLoginAt to show they're online (non-blocking, throttled)
    // Only update 10% of requests to reduce database load
    if (Math.random() < 0.1) {
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      }).catch((updateError) => {
        // Silently fail - this is non-critical
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to update lastLoginAt:', updateError)
        }
      })
    }

    // Get all users except current user
    // Consider users online if they logged in within last 2 minutes (more accurate)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)
    
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
      isOnline: player.lastLoginAt && new Date(player.lastLoginAt) > twoMinutesAgo
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

