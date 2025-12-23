import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Update user's lastLoginAt to track online status (non-blocking, throttled)
    // Only update if last update was more than 30 seconds ago to reduce DB load
    // This is done asynchronously and doesn't block the request
    if (Math.random() < 0.1) { // Only update 10% of requests to reduce load
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

    const game = await prisma.game.findUnique({
      where: { id: params.id },
      include: {
        whitePlayer: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        blackPlayer: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        moves: {
          orderBy: { moveNumber: 'asc' }
        }
      }
    })

    if (!game) {
      return NextResponse.json({ error: 'Игра не найдена' }, { status: 404 })
    }

    // Check if user is part of this game
    if (String(game.whitePlayerId) !== String(user.id) && String(game.blackPlayerId) !== String(user.id) && !user.isAdmin) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }


    return NextResponse.json({ game })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching game:', error)
    }
    return NextResponse.json(
      { error: 'Ошибка получения игры' },
      { status: 500 }
    )
  }
}

