# Scripts

This directory contains utility scripts for database management and setup.

## Files

- **`apply-migration.js`** - Script to manually apply database migrations
  - Usage: `npm run migrate:apply` or `node scripts/apply-migration.js`
  - Applies the migration to remove status from unique constraint in GameInvite

- **`supabase-rls-setup.sql`** - SQL script for enabling Row Level Security (RLS) in Supabase
  - This script should be run manually through Supabase SQL Editor
  - Enables RLS for all tables and creates appropriate policies
