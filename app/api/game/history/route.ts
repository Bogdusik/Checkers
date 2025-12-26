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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const games = await prisma.game.findMany({
      where: {
        OR: [{ whitePlayerId: user.id }, { blackPlayerId: user.id }],
        status: { in: ['WHITE_WON', 'BLACK_WON', 'DRAW', 'ABANDONED'] }
      },
      include: {
        whitePlayer: { select: { id: true, username: true } },
        blackPlayer: { select: { id: true, username: true } }
      },
      orderBy: { endedAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await prisma.game.count({
      where: {
        OR: [{ whitePlayerId: user.id }, { blackPlayerId: user.id }],
        status: { in: ['WHITE_WON', 'BLACK_WON', 'DRAW', 'ABANDONED'] }
      }
    })

    return NextResponse.json({ games, total, hasMore: offset + limit < total })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения истории игр' }, { status: 500 })
  }
}
