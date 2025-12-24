/**
 * Common validation schemas using Zod
 * Reusable validation schemas for API endpoints
 */

import { z } from 'zod'

/**
 * Common validation schemas
 */
export const schemas = {
  // Authentication
  register: z.object({
    email: z.string().email('Неверный формат email'),
    username: z.string().min(3, 'Username должен быть минимум 3 символа').max(20, 'Username должен быть максимум 20 символов'),
    password: z.string().min(6, 'Пароль должен быть минимум 6 символов')
  }),

  login: z.object({
    email: z.string().email('Неверный формат email'),
    password: z.string().min(1, 'Пароль обязателен')
  }),

  // Game
  move: z.object({
    from: z.string().regex(/^[a-h][1-8]$/, 'Неверный формат начальной позиции'),
    to: z.string().regex(/^[a-h][1-8]$/, 'Неверный формат конечной позиции')
  }),

  createGame: z.object({
    opponentId: z.string().optional(),
    timeControl: z.number().positive().optional()
  }),

  // Chat
  chatMessage: z.object({
    message: z.string().min(1, 'Сообщение не может быть пустым').max(500, 'Сообщение слишком длинное (максимум 500 символов)')
  }),

  // Friends
  friendRequest: z.object({
    target: z.string().min(1, 'Username или email обязателен')
  }),

  friendRespond: z.object({
    requestId: z.string().uuid('Неверный формат ID заявки'),
    action: z.enum(['accept', 'decline'], {
      errorMap: () => ({ message: 'Действие должно быть accept или decline' })
    })
  }),

  // Game invites
  sendInvite: z.object({
    toUserId: z.string().uuid('Неверный формат ID пользователя')
  }),

  acceptInvite: z.object({
    inviteId: z.string().uuid('Неверный формат ID приглашения')
  }),

  // Draw
  drawAction: z.object({
    action: z.enum(['offer', 'accept', 'decline'], {
      errorMap: () => ({ message: 'Действие должно быть offer, accept или decline' })
    })
  })
}

/**
 * Validates request body against schema
 * @throws ValidationError if validation fails
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(', ')
      throw new Error(`Валидация не пройдена: ${messages}`)
    }
    throw error
  }
}

