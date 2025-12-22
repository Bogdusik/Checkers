import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json({ user: null })
    }

    // Update lastLoginAt to track online status
    // This helps determine if user is currently active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Fetch updated user with statistics
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        statistics: true
      }
    })

    return NextResponse.json({
      user: {
        id: updatedUser!.id,
        email: updatedUser!.email,
        username: updatedUser!.username,
        isAdmin: updatedUser!.isAdmin,
        lastLoginAt: updatedUser!.lastLoginAt,
        statistics: updatedUser!.statistics
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

