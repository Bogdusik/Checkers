import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNewGame, gameToFen } from '@/lib/checkers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { inviteId } = body

    if (!inviteId) {
      return NextResponse.json({ error: 'Не указано приглашение' }, { status: 400 })
    }

    // Get invite
    const invite = await prisma.gameInvite.findUnique({
      where: { id: inviteId },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    })

    if (!invite) {
      return NextResponse.json({ error: 'Приглашение не найдено' }, { status: 404 })
    }

    // Check if user is the recipient of the invite
    // Only the person who received the invite can accept it
    // Use String() to ensure type consistency
    if (String(invite.toUserId) !== String(user.id)) {
      console.error('User mismatch:', {
        inviteToUserId: invite.toUserId,
        inviteToUserIdType: typeof invite.toUserId,
        userId: user.id,
        userIdType: typeof user.id,
        areEqual: invite.toUserId === user.id,
        stringEqual: String(invite.toUserId) === String(user.id)
      })
      return NextResponse.json({ 
        error: 'Вы не можете принять это приглашение. Только получатель может принять приглашение.' 
      }, { status: 403 })
    }

    if (invite.status !== 'PENDING') {
      return NextResponse.json({ error: 'Приглашение уже обработано' }, { status: 400 })
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Double-check invite status (prevent race condition)
      const currentInvite = await tx.gameInvite.findUnique({
        where: { id: inviteId }
      })

      if (!currentInvite) {
        throw new Error('Приглашение не найдено')
      }

      // Check if invite expired
      if (new Date(currentInvite.expiresAt) < new Date()) {
        // Mark as expired within transaction
        await tx.gameInvite.update({
          where: { id: inviteId },
          data: { status: 'EXPIRED' }
        })
        throw new Error('Приглашение истекло')
      }

      if (currentInvite.status !== 'PENDING') {
        throw new Error('Приглашение уже обработано')
      }

      // Use String() to ensure type consistency
      if (String(currentInvite.toUserId) !== String(user.id)) {
        console.error('Transaction user mismatch:', {
          inviteToUserId: currentInvite.toUserId,
          userId: user.id
        })
        throw new Error('Вы не можете принять это приглашение')
      }

      // Create game
      const checkersGame = createNewGame()
      const initialFen = gameToFen(checkersGame)

      // Randomly assign colors for fairness
      const isUserWhite = Math.random() < 0.5
      const whitePlayerId = isUserWhite ? user.id : invite.fromUserId
      const blackPlayerId = isUserWhite ? invite.fromUserId : user.id

      // Ensure players are different
      if (whitePlayerId === blackPlayerId) {
        throw new Error('Нельзя играть с самим собой')
      }

      const game = await tx.game.create({
        data: {
          whitePlayerId,
          blackPlayerId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          fen: initialFen
        },
        include: {
          whitePlayer: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          blackPlayer: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      })

      // Update invite - use updateMany to avoid potential unique constraint issues
      const updateResult = await tx.gameInvite.updateMany({
        where: { 
          id: inviteId,
          status: 'PENDING' // Only update if still pending (prevent race condition)
        },
        data: {
          status: 'ACCEPTED',
          gameId: game.id
        }
      })

      // If update didn't affect any rows, invite was already processed
      if (updateResult.count === 0) {
        throw new Error('Приглашение уже обработано')
      }

      return game
    })

    const game = result

    return NextResponse.json({ game, inviteId })
  } catch (error: any) {
    // Log detailed error (always log in production for debugging)
    console.error('Error accepting invite:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      name: error?.name,
      stack: error?.stack
    })
    
    // Check for specific Prisma errors
    if (error?.code === 'P2002') {
      // Unique constraint violation
      const constraintFields = error?.meta?.target || []
      console.error('Unique constraint violation:', constraintFields)
      
      // If it's the old constraint (fromUserId, toUserId, status), migration wasn't applied
      if (constraintFields.includes('fromUserId') && constraintFields.includes('toUserId') && constraintFields.includes('status')) {
        console.error('CRITICAL: Database migration not applied! Unique constraint (fromUserId, toUserId, status) still exists.')
        return NextResponse.json(
          { error: 'Ошибка обновления приглашения. Обратитесь к администратору.' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Ошибка обновления приглашения. Попробуйте еще раз.' },
        { status: 400 }
      )
    }
    
    // Check for Prisma connection errors
    if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database') || error?.message?.includes('MaxClientsInSessionMode')) {
      return NextResponse.json(
        { error: 'Ошибка подключения к базе данных. Попробуйте позже.' },
        { status: 503 }
      )
    }
    
    // Handle custom errors from transaction
    if (error?.message === 'Приглашение не найдено' || 
        error?.message === 'Приглашение уже обработано' ||
        error?.message === 'Вы не можете принять это приглашение' ||
        error?.message === 'Нельзя играть с самим собой' ||
        error?.message === 'Приглашение истекло') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || 'Ошибка принятия приглашения' },
      { status: 500 }
    )
  }
}

