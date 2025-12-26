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

    // Verify user has access to this game
    const game = await prisma.game.findUnique({
      where: { id: params.id }
    })

    if (!game) {
      return new Response('Game not found', { status: 404 })
    }

    if (game.whitePlayerId !== user.id && game.blackPlayerId !== user.id) {
      return new Response('Forbidden', { status: 403 })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller: ReadableStreamDefaultController<Uint8Array>) {
        const send = (data: any) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
          } catch (err) {
            // Client disconnected, close stream
            controller.close()
          }
        }

        // Send initial game state (trimmed fields)
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
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error loading initial game state:', error)
          }
          send({ type: 'error', message: 'Failed to load game' })
        }

        // Poll for updates (small payload)
        const interval: NodeJS.Timeout = setInterval(async () => {
          try {
            const gameData = await prisma.game.findUnique({
              where: { id: params.id },
              include: {
                moves: {
                  orderBy: { moveNumber: 'desc' },
                  take: 1
                }
              }
            })

            if (gameData && gameData.moves.length > 0) {
              const lastMove = gameData.moves[0]
              send({
                type: 'move',
                move: lastMove.move,
                fen: gameData.fen,
                status: gameData.status
              })
            }
          } catch (error: any) {
            // Check for connection errors
            if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database') || error?.message?.includes('MaxClientsInSessionMode')) {
              send({ type: 'error', message: 'Database connection error' })
              clearInterval(interval)
              controller.close()
              return
            }
            
            if (process.env.NODE_ENV === 'development') {
              console.error('Error polling game:', error)
            }
            // Don't close stream on transient errors, just log
          }
        }, 1000) // Poll every second

        request.signal.addEventListener('abort', () => {
          clearInterval(interval)
          try {
            controller.close()
          } catch (err) {
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
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in stream endpoint:', error)
    }
    
    // Check for connection errors
    if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database') || error?.message?.includes('MaxClientsInSessionMode')) {
      return new Response('Database connection error', { status: 503 })
    }
    
    return new Response('Internal server error', { status: 500 })
  }
}

