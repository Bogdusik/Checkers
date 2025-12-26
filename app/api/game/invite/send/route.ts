import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return NextResponse.json({ error: 'Неверный формат запроса' }, { status: 400 })
    }

    const { toUserId } = body

    if (!toUserId || typeof toUserId !== 'string') {
      console.error('Invalid toUserId:', toUserId, 'Type:', typeof toUserId)
      return NextResponse.json({ error: 'Не указан получатель приглашения' }, { status: 400 })
    }

    if (toUserId === user.id) {
      return NextResponse.json({ error: 'Нельзя пригласить самого себя' }, { status: 400 })
    }

    // Check if user exists
    const toUser = await prisma.user.findUnique({
      where: { id: toUserId }
    })

    if (!toUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Use transaction to ensure atomicity and prevent race conditions
    const invite = await prisma.$transaction(async (tx) => {
      // First, mark expired invites as EXPIRED
      const expiredCount = await tx.gameInvite.updateMany({
        where: {
          OR: [
            { fromUserId: user.id, toUserId },
            { fromUserId: toUserId, toUserId: user.id }
          ],
          status: 'PENDING',
          expiresAt: {
            lt: new Date()
          }
        },
        data: {
          status: 'EXPIRED'
        }
      })
      
      if (expiredCount.count > 0) {
        console.log(`Marked ${expiredCount.count} expired invite(s)`)
      }

      // Check if there's already a pending invite (in either direction)
      // This prevents duplicate PENDING invites between the same users
      const existingInvite = await tx.gameInvite.findFirst({
        where: {
          OR: [
            { fromUserId: user.id, toUserId, status: 'PENDING' },
            { fromUserId: toUserId, toUserId: user.id, status: 'PENDING' }
          ],
          expiresAt: {
            gt: new Date()
          }
        }
      })

      if (existingInvite) {
        console.log('Existing pending invite found:', existingInvite.id)
        throw new Error('Приглашение уже отправлено')
      }

      // Create invite
      return await tx.gameInvite.create({
        data: {
          fromUserId: user.id,
          toUserId,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
        },
        include: {
          fromUser: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          toUser: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      })
    })

    return NextResponse.json({ invite })
  } catch (error: any) {
    // Log detailed error for debugging (always log in production too for this critical endpoint)
    console.error('Error sending invite:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      name: error?.name
    })
    
    // Check for Prisma connection errors
    if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database') || error?.message?.includes('MaxClientsInSessionMode')) {
      return NextResponse.json(
        { error: 'Ошибка подключения к базе данных. Попробуйте позже.' },
        { status: 503 }
      )
    }
    
    // Check for Prisma unique constraint violation
    // This happens when migration is not applied - unique constraint (fromUserId, toUserId, status) still exists
    if (error?.code === 'P2002') {
      const constraintFields = error?.meta?.target || []
      if (constraintFields.includes('fromUserId') && constraintFields.includes('toUserId') && constraintFields.includes('status')) {
        // Migration not applied - need to apply it
        console.error('CRITICAL: Database migration not applied! Unique constraint (fromUserId, toUserId, status) still exists.')
        console.error('Please apply migration: ALTER TABLE "GameInvite" DROP CONSTRAINT IF EXISTS "GameInvite_fromUserId_toUserId_status_key";')
        return NextResponse.json(
          { error: 'Приглашение уже отправлено. Если ошибка повторяется, обратитесь к администратору.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Приглашение уже существует. Попробуйте позже.' },
        { status: 400 }
      )
    }
    
    // Handle custom errors from transaction
    if (error?.message === 'Приглашение уже отправлено') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || 'Ошибка отправки приглашения' },
      { status: 500 }
    )
  }
}

