import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { requestId, action } = await request.json() as { requestId?: string; action?: 'accept' | 'decline' }
    if (!requestId || !action) {
      return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
    }

    const friendRequest = await prisma.friend.findUnique({ where: { id: requestId } })
    if (!friendRequest || friendRequest.addresseeId !== currentUser.id || friendRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Заявка недоступна' }, { status: 400 })
    }

    const updated = await prisma.friend.update({
      where: { id: requestId },
      data: {
        status: action === 'accept' ? 'ACCEPTED' : 'DECLINED',
        acceptedAt: action === 'accept' ? new Date() : null
      }
    })

    return NextResponse.json({ request: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка обработки заявки' }, { status: 500 })
  }
}
