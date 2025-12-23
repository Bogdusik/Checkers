// @ts-ignore - Prisma Client is generated
import { PrismaClient } from '@prisma/client'

const { DATABASE_URL } = process.env

if (!DATABASE_URL) {
  // Fail fast so deployments don't succeed without a database connection
  throw new Error('DATABASE_URL is not set. Configure it in the environment before running the app.')
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

