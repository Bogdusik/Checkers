# Scripts

This directory contains utility scripts for database management and setup.

## Files

- **`migrate-database.sh`** - Script for migrating data from local database to Supabase
  - Usage: `./scripts/migrate-database.sh`
  - Make sure to update database URLs in the script before running

- **`supabase-rls-setup.sql`** - SQL script for enabling Row Level Security (RLS) in Supabase
  - This script should be run manually through Supabase SQL Editor
  - Enables RLS for all tables and creates appropriate policies

