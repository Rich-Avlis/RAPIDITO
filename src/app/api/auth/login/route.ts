import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword, createSession } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone: validatedData.phone },
      include: {
        passengerProfile: true,
        driverProfile: {
          include: {
            vehicle: true,
            wallet: true,
          },
        },
      },
    })

    if (!user) {
      return errorResponse('Invalid credentials', 401)
    }

    if (!user.isActive) {
      return errorResponse('Account is deactivated', 403)
    }

    if (!user.passwordHash) {
      return errorResponse('Please login with OTP', 400)
    }

    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.passwordHash)
    if (!isValidPassword) {
      return errorResponse('Invalid credentials', 401)
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Create session
    const session = await createSession(user.id)

    const response = successResponse({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        passengerProfile: user.passengerProfile,
        driverProfile: user.driverProfile,
      },
      ...session,
    })

    // Set HTTP-only cookies
    response.cookies.set('access_token', session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
    })

    response.cookies.set('refresh_token', session.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return errorResponse('Validation failed: ' + error.message, 422)
    }
    return errorResponse('Internal server error', 500)
  }
}
