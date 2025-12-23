// Helper function to ensure UserStatistics exists
import { prisma } from './prisma'

export async function ensureUserStatistics(userId: string) {
  let stats = await prisma.userStatistics.findUnique({
    where: { userId }
  })

  if (!stats) {
    stats = await prisma.userStatistics.create({
      data: {
        userId,
        rating: 1000
      }
    })
  }

  return stats
}

