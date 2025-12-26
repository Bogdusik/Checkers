import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, username, password } = registerSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email или username уже используется' },
        { status: 400 }
      )
    }

    // Create user
    const hashedPassword = await hashPassword(password)
    // Make bogdyn13@gmail.com admin
    const isAdmin = email === 'bogdyn13@gmail.com'
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        isAdmin,
        statistics: {
          create: {}
        }
      }
    })

    // Generate token
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
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error: any) {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Register error:', error)
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        meta: error?.meta,
        name: error?.name
      })
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Неверные данные', details: error.errors },
        { status: 400 }
      )
    }
    
    // Check for Prisma unique constraint violation (email/username already exists)
    if (error?.code === 'P2002') {
      const field = error?.meta?.target?.[0] || 'поле'
      return NextResponse.json(
        { error: `${field === 'email' ? 'Email' : 'Username'} уже используется` },
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
    
    return NextResponse.json(
      { error: error?.message || 'Ошибка регистрации. Попробуйте позже.' },
      { status: 500 }
    )
  }
}

