import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const migrationSQL = `
      ALTER TABLE "GameInvite" DROP CONSTRAINT IF EXISTS "GameInvite_fromUserId_toUserId_status_key";
      CREATE INDEX IF NOT EXISTS "GameInvite_fromUserId_toUserId_idx" ON "GameInvite"("fromUserId", "toUserId");
    `

    try {
      await prisma.$executeRawUnsafe(migrationSQL)
      return NextResponse.json({ success: true, message: 'Migration applied successfully.' })
    } catch (migrationError: any) {
      if (migrationError.message?.includes('does not exist') || migrationError.code === '42704') {
        return NextResponse.json({ success: true, message: 'Migration already applied.' })
      }
      throw migrationError
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error applying migration' }, { status: 500 })
  }
}
