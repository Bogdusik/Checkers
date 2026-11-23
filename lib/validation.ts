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
    email: z.string().email('Invalid email address'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  }),

  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  }),

  // Game
  move: z.object({
    from: z.string().regex(/^[a-h][1-8]$/, 'Invalid start square'),
    to: z.string().regex(/^[a-h][1-8]$/, 'Invalid target square')
  }),

  createGame: z.object({
    opponentId: z.string().optional(),
    timeControl: z.number().positive().optional()
  }),

  // Chat
  chatMessage: z.object({
    message: z.string().min(1, 'Message cannot be empty').max(500, 'Message is too long (500 characters max)')
  }),

  // Friends
  friendRequest: z.object({
    target: z.string().min(1, 'Username or email is required')
  }),

  friendRespond: z.object({
    requestId: z.string().uuid('Invalid request ID'),
    action: z.enum(['accept', 'decline'], {
      errorMap: () => ({ message: 'Action must be accept or decline' })
    })
  }),

  // Game invites
  sendInvite: z.object({
    toUserId: z.string().uuid('Invalid user ID')
  }),

  acceptInvite: z.object({
    inviteId: z.string().uuid('Invalid invite ID')
  }),

  // Draw
  drawAction: z.object({
    action: z.enum(['offer', 'accept', 'decline'], {
      errorMap: () => ({ message: 'Action must be offer, accept or decline' })
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
      throw new Error(`Validation failed: ${messages}`)
    }
    throw error
  }
}

