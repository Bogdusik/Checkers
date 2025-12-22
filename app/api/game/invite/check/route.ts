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

    // Check if user has any recently accepted invites (game was created in last 30 seconds)
    // This ensures we only redirect to games that were just created
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000)
    
    const acceptedInvite = await prisma.gameInvite.findFirst({
      where: {
        OR: [
          { fromUserId: user.id, status: 'ACCEPTED' },
          { toUserId: user.id, status: 'ACCEPTED' }
        ],
        gameId: { not: null },
        updatedAt: {
          gte: thirtySecondsAgo
        }
      },
      include: {
        game: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    if (acceptedInvite && acceptedInvite.game && acceptedInvite.game.status === 'IN_PROGRESS') {
      return NextResponse.json({ 
        hasGame: true, 
        gameId: acceptedInvite.game.id 
      })
    }

    return NextResponse.json({ hasGame: false })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error checking invite:', error)
    }
    return NextResponse.json(
      { error: 'Ошибка проверки приглашения' },
      { status: 500 }
    )
  }
}

