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
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    const game = await prisma.game.findUnique({
      where: { id: params.id },
      include: {
        whitePlayer: { select: { id: true, username: true, email: true } },
        blackPlayer: { select: { id: true, username: true, email: true } },
        moves: { orderBy: { moveNumber: 'asc' } }
      }
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (String(game.whitePlayerId) !== String(user.id) && 
        String(game.blackPlayerId) !== String(user.id) && 
        !user.isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ game })
  } catch (error: any) {
    if (error?.code === 'P1001') {
      return NextResponse.json({ error: 'Database connection error' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Could not load the game' }, { status: 500 })
  }
}
