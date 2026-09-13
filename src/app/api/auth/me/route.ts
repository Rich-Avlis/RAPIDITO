import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { successResponse, unauthorizedResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return unauthorizedResponse()
    }

    return successResponse({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
        isVerified: user.isVerified,
        passengerProfile: user.passengerProfile,
        driverProfile: user.driverProfile,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return unauthorizedResponse()
  }
}
