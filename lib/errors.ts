/**
 * Centralized error handling utilities
 * Provides consistent error responses and logging
 */

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Не авторизован') {
    super(message, 401, 'AUTH_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Нет доступа') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Ресурс не найден') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

/**
 * Logs error with context information
 */
export function logError(error: unknown, context?: Record<string, any>) {
  const timestamp = new Date().toISOString()
  const errorInfo = {
    timestamp,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    } : error,
    context
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', errorInfo)
  } else {
    // In production, you might want to send to a logging service
    console.error(JSON.stringify(errorInfo))
  }
}

/**
 * Handles errors and returns appropriate response
 */
export function handleError(error: unknown): { message: string; statusCode: number; code?: string; details?: any } {
  if (error instanceof AppError) {
    logError(error)
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code
    }
  }

  if (error instanceof Error) {
    logError(error)
    return {
      message: 'Внутренняя ошибка сервера',
      statusCode: 500,
      code: 'INTERNAL_ERROR'
    }
  }

  logError(error)
  return {
    message: 'Неизвестная ошибка',
    statusCode: 500,
    code: 'UNKNOWN_ERROR'
  }
}

