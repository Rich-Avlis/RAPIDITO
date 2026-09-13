import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { successResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Clear cookies
    cookieStore.delete('access_token')
    cookieStore.delete('refresh_token')

    return successResponse(null, 'Logged out successfully')
  } catch (error) {
    console.error('Logout error:', error)
    return successResponse(null, 'Logged out')
  }
}
