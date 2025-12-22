import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller: ReadableStreamDefaultController<Uint8Array>) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Send initial game state
      try {
        const game = await prisma.game.findUnique({
          where: { id: params.id },
          include: {
            whitePlayer: { select: { id: true, username: true } },
            blackPlayer: { select: { id: true, username: true } }
          }
        })

        if (game) {
          send({ type: 'gameState', game, fen: game.fen })
        }
      } catch (error) {
        send({ type: 'error', message: 'Failed to load game' })
      }

      // Poll for updates
      const interval: NodeJS.Timeout = setInterval(async () => {
        try {
          const game = await prisma.game.findUnique({
            where: { id: params.id },
            include: {
              moves: {
                orderBy: { moveNumber: 'desc' },
                take: 1
              }
            }
          })

          if (game && game.moves.length > 0) {
            const lastMove = game.moves[0]
            send({
              type: 'move',
              move: lastMove.move,
              fen: game.fen,
              status: game.status
            })
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error polling game:', error)
          }
        }
      }, 1000) // Poll every second

      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
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
}

