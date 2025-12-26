import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const { email, password } = loginSchema.parse(await request.json())
    const user = await prisma.user.findUnique({
      where: { email },
      include: { statistics: true }
    })

    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    const token = generateToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin
    })

    const response = NextResponse.json({
      message: 'Вход выполнен',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
        statistics: user.statistics
      }
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })

    return response
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные данные' }, { status: 400 })
    }
    if (error?.code === 'P1001') {
      return NextResponse.json({ error: 'Ошибка подключения к БД' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Ошибка входа' }, { status: 500 })
  }
}
