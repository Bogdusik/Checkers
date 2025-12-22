import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json({ user: null })
    }

    // Try to update lastLoginAt to track online status (non-blocking)
    // This helps determine if user is currently active
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })
    } catch (updateError) {
      // If update fails, log but don't block the request
      console.error('Failed to update lastLoginAt:', updateError)
    }

    // Fetch user with statistics
    const userWithStats = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        statistics: true
      }
    })

    if (!userWithStats) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
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
    console.error('Error in /api/auth/me:', error)
    return NextResponse.json(
      { error: 'Ошибка получения данных пользователя' },
      { status: 500 }
    )
  }
}

