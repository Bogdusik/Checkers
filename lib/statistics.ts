import { prisma } from './prisma'

export async function ensureUserStatistics(userId: string) {
  return prisma.userStatistics.upsert({
    where: { userId },
    update: {},
    create: { userId, rating: 1000 }
  })
}

