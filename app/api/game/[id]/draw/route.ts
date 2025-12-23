import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureUserStatistics } from '@/lib/statistics'
import { GameStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

// Offer draw
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body // 'offer' or 'accept' or 'decline'

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
        }
      }
    })

    if (!game) {
      return NextResponse.json({ error: 'Игра не найдена' }, { status: 404 })
    }

    // Check if user is part of this game
    if (String(game.whitePlayerId) !== String(user.id) && String(game.blackPlayerId) !== String(user.id)) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    // Check game status
    if (game.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Игра не в процессе' }, { status: 400 })
    }

    if (action === 'offer') {
      // Offer draw
      const updatedGame = await prisma.game.update({
        where: { id: params.id },
        data: {
          drawOfferBy: user.id
        },
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
          }
        }
      })

      return NextResponse.json({
        success: true,
        game: updatedGame,
        message: 'Предложение ничьей отправлено'
      })
    } else if (action === 'accept') {
      // Accept draw
      if (!game.drawOfferBy || String(game.drawOfferBy) === String(user.id)) {
        return NextResponse.json({ error: 'Нет активного предложения ничьей' }, { status: 400 })
      }

      const updatedGame = await prisma.game.update({
        where: { id: params.id },
        data: {
          status: 'DRAW',
          endedAt: new Date(),
          drawOfferBy: null
        },
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
          }
        }
      })

      // Update statistics
      const isPlayingAgainstSelf = String(game.whitePlayerId) === String(game.blackPlayerId)

      if (!isPlayingAgainstSelf) {
        const whiteStats = await ensureUserStatistics(game.whitePlayerId)
        const blackStats = await ensureUserStatistics(game.blackPlayerId)

        await prisma.userStatistics.update({
          where: { userId: game.whitePlayerId },
          data: {
            totalGames: whiteStats.totalGames + 1,
            draws: whiteStats.draws + 1
          }
        })

        await prisma.userStatistics.update({
          where: { userId: game.blackPlayerId },
          data: {
            totalGames: blackStats.totalGames + 1,
            draws: blackStats.draws + 1
          }
        })
      }

      return NextResponse.json({
        success: true,
        game: updatedGame,
        message: 'Ничья принята'
      })
    } else if (action === 'decline') {
      // Decline draw
      const updatedGame = await prisma.game.update({
        where: { id: params.id },
        data: {
          drawOfferBy: null
        },
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
          }
        }
      })

      return NextResponse.json({
        success: true,
        game: updatedGame,
        message: 'Предложение ничьей отклонено'
      })
    }

    return NextResponse.json({ error: 'Неверное действие' }, { status: 400 })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handling draw:', error)
    }
    return NextResponse.json(
      { error: 'Ошибка обработки предложения ничьей' },
      { status: 500 }
    )
  }
}

