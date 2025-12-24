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

// Compare IDs safely (handles string/number conversion)
export const idsEqual = (id1: string | number | null | undefined, id2: string | number | null | undefined): boolean => {
  if (id1 === null || id1 === undefined || id2 === null || id2 === undefined) return false
  return String(id1) === String(id2)
}

