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

// Configure Prisma with connection pooling settings
// This helps prevent "MaxClientsInSessionMode" errors
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Gracefully disconnect on process termination
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

