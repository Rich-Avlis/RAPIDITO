import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'

export function successResponse<T>(data: T, message?: string, status = 200) {
  const response: ApiResponse<T> = { success: true, data, message }
  return NextResponse.json(response, { status })
}

export function errorResponse(error: string, status = 400) {
  const response: ApiResponse = { success: false, error }
  return NextResponse.json(response, { status })
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return errorResponse(message, 401)
}

export function forbiddenResponse(message = 'Forbidden') {
  return errorResponse(message, 403)
}

export function notFoundResponse(message = 'Not found') {
  return errorResponse(message, 404)
}

export function validationErrorResponse(errors: Record<string, string>) {
  return NextResponse.json(
    { success: false, error: 'Validation failed', details: errors },
    { status: 422 }
  )
}
