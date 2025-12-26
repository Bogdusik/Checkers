import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ user: null })
    }

    const userWithStats = await prisma.user.findUnique({
      where: { id: user.id },
      include: { statistics: true }
    })

    if (!userWithStats) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: userWithStats.id,
        email: userWithStats.email,
        username: userWithStats.username,
        isAdmin: userWithStats.isAdmin,
        lastLoginAt: userWithStats.lastLoginAt,
        statistics: userWithStats.statistics
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения данных пользователя' }, { status: 500 })
  }
}
