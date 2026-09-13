import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyOtpCode, createSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, code, purpose } = body

    // Validation
    if (!phone || !code || !purpose) {
      return errorResponse('Todos los campos son requeridos', 400)
    }

    const phoneRegex = /^\+58\d{10}$/
    if (!phoneRegex.test(phone)) {
      return errorResponse('Formato de teléfono inválido', 400)
    }

    if (code.length !== 6) {
      return errorResponse('El código debe tener 6 dígitos', 400)
    }

    if (!['registration', 'login', 'password_reset'].includes(purpose)) {
      return errorResponse('Propósito inválido', 400)
    }

    // Verify OTP
    const result = await verifyOtpCode(phone, code, purpose)

    if (!result.valid) {
      return errorResponse(result.error || 'Código inválido', 400)
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { phone } })

    if (purpose === 'registration') {
      // Mark user as verified
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true },
        })
      }
    }

    if (!user) {
      return errorResponse('Usuario no encontrado', 404)
    }

    // Create session
    const session = await createSession(
      user.id,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    )

    // Get user with profiles
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
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

    const response = successResponse({
      user: {
        id: fullUser!.id,
        firstName: fullUser!.firstName,
        lastName: fullUser!.lastName,
        phone: fullUser!.phone,
        email: fullUser!.email,
        role: fullUser!.role,
        isVerified: true,
        passengerProfile: fullUser!.passengerProfile,
        driverProfile: fullUser!.driverProfile,
      },
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    }, 'Verificación exitosa')

    // Set cookies
    response.cookies.set('access_token', session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    })

    response.cookies.set('refresh_token', session.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return errorResponse('Error al verificar el código', 500)
  }
}
