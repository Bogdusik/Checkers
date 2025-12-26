import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const game = await prisma.game.findUnique({ where: { id: params.id } })
    if (!game || (String(game.whitePlayerId) !== String(user.id) && String(game.blackPlayerId) !== String(user.id))) {
      return new Response('Forbidden', { status: 403 })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller: ReadableStreamDefaultController<Uint8Array>) {
        const send = (data: any) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
          } catch {
            controller.close()
          }
        }

        try {
          const gameData = await prisma.game.findUnique({
            where: { id: params.id },
            include: {
              whitePlayer: { select: { id: true, username: true } },
              blackPlayer: { select: { id: true, username: true } }
            }
          })

          if (gameData) {
            send({
              type: 'gameState',
              game: {
                id: gameData.id,
                status: gameData.status,
                whitePlayerId: gameData.whitePlayerId,
                blackPlayerId: gameData.blackPlayerId,
                whitePlayer: gameData.whitePlayer,
                blackPlayer: gameData.blackPlayer,
              },
              fen: gameData.fen,
            })
          }
        } catch {
          send({ type: 'error', message: 'Failed to load game' })
        }

        const interval = setInterval(async () => {
          try {
            const gameData = await prisma.game.findUnique({
              where: { id: params.id },
              include: {
                moves: { orderBy: { moveNumber: 'desc' }, take: 1 }
              }
            })

            if (gameData && gameData.moves && gameData.moves.length > 0) {
              send({
                type: 'move',
                move: gameData.moves[0].move,
                fen: gameData.fen,
                status: gameData.status
              })
            }
          } catch {
            // Silently fail
          }
        }, 1000)

        request.signal.addEventListener('abort', () => {
          clearInterval(interval)
          try {
            controller.close()
          } catch {
            // Already closed
          }
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    if (error?.code === 'P1001') {
      return new Response('Database connection error', { status: 503 })
    }
    return new Response('Internal server error', { status: 500 })
  }
}
