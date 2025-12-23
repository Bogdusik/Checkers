// Common utilities

export const isDev = process.env.NODE_ENV === 'development'

export const logError = (error: any, context: string) => {
  if (isDev) console.error(`[${context}]`, error)
}

export const formatDate = (date: string | null) => {
  if (!date) return 'Никогда'
  return new Date(date).toLocaleString('ru-RU')
}

export const isActiveUser = (lastLoginAt: string | null, days: number = 7) => {
  if (!lastLoginAt) return false
  return new Date(lastLoginAt) > new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

export const isToday = (date: string | null) => {
  if (!date) return false
  const today = new Date()
  const checkDate = new Date(date)
  return checkDate.toDateString() === today.toDateString()
}

