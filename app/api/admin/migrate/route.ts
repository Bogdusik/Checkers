import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'This endpoint has been removed. Run migrations via Prisma CLI.' }, { status: 410 })
}
