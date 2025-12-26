#!/usr/bin/env node

/**
 * Script to apply database migration manually
 * Usage: node scripts/apply-migration.js
 * 
 * This script applies the migration to remove status from unique constraint in GameInvite
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function applyMigration() {
  try {
    console.log('Applying migration: remove_status_from_unique_index...')
    
    const migrationSQL = `
-- Remove status from unique constraint in GameInvite
-- This allows updating invite status without violating unique constraint

-- Drop the old unique constraint
ALTER TABLE "GameInvite" DROP CONSTRAINT IF EXISTS "GameInvite_fromUserId_toUserId_status_key";

-- Add index for faster lookups (without unique constraint)
CREATE INDEX IF NOT EXISTS "GameInvite_fromUserId_toUserId_idx" ON "GameInvite"("fromUserId", "toUserId");
    `.trim()

    // Execute migration using Prisma's $executeRawUnsafe
    await prisma.$executeRawUnsafe(migrationSQL)
    
    console.log('✅ Migration applied successfully!')
    console.log('The unique constraint on (fromUserId, toUserId, status) has been removed.')
    console.log('New index on (fromUserId, toUserId) has been created.')
    
  } catch (error) {
    console.error('❌ Error applying migration:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

applyMigration()

