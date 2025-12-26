import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Admin endpoint to apply database migration
 * This should be called once to fix the unique constraint issue
 * 
 * SECURITY: Only admins can access this endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    console.log('Applying migration: remove_status_from_unique_index...')

    // Migration SQL to remove status from unique constraint
    const migrationSQL = `
      -- Drop the old unique constraint
      ALTER TABLE "GameInvite" DROP CONSTRAINT IF EXISTS "GameInvite_fromUserId_toUserId_status_key";
      
      -- Add index for faster lookups (without unique constraint)
      CREATE INDEX IF NOT EXISTS "GameInvite_fromUserId_toUserId_idx" ON "GameInvite"("fromUserId", "toUserId");
    `

    try {
      await prisma.$executeRawUnsafe(migrationSQL)
      
      return NextResponse.json({ 
        success: true,
        message: 'Migration applied successfully. The unique constraint has been removed.'
      })
    } catch (migrationError: any) {
      // Check if constraint already doesn't exist (migration already applied)
      if (migrationError.message?.includes('does not exist') || 
          migrationError.code === '42704') {
        return NextResponse.json({ 
          success: true,
          message: 'Migration already applied or constraint does not exist.'
        })
      }
      throw migrationError
    }
  } catch (error: any) {
    console.error('Error applying migration:', error)
    return NextResponse.json(
      { error: error?.message || 'Error applying migration' },
      { status: 500 }
    )
  }
}

