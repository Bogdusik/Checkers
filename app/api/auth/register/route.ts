import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(6),
})

const REGISTER_RATE_LIMIT = { windowMs: 60 * 60 * 1000, maxRequests: 5 }

export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(getClientIdentifier(request), REGISTER_RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Слишком много регистраций. Попробуйте позже.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetTime - Date.now()) / 1000)) } }
      )
    }

    const { email, username, password } = registerSchema.parse(await request.json())

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email или username уже используется' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)
    const isAdmin = !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL
    
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        isAdmin,
        statistics: { create: {} }
      }
    })

    const token = generateToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin
    })

    const response = NextResponse.json({
      message: 'Регистрация успешна',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin
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
    if (error?.code === 'P2002') {
      const field = error?.meta?.target?.[0] || 'поле'
      return NextResponse.json({ error: `${field === 'email' ? 'Email' : 'Username'} уже используется` }, { status: 400 })
    }
    if (error?.code === 'P1001') {
      return NextResponse.json({ error: 'Ошибка подключения к БД' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Ошибка регистрации' }, { status: 500 })
  }
}
