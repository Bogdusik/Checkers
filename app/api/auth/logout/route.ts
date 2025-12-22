import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ message: 'Выход выполнен' })
  response.cookies.delete('token')
  return response
}

