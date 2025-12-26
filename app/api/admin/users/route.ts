import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      include: {
        statistics: true,
        _count: {
          select: {
            whiteGames: true,
            blackGames: true,
            wonGames: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения пользователей' }, { status: 500 })
  }
}
