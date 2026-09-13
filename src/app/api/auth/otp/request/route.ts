import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { createOtpCode } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, purpose } = body

    // Validation
    if (!phone) {
      return errorResponse('El teléfono es requerido', 400)
    }

    const phoneRegex = /^\+58\d{10}$/
    if (!phoneRegex.test(phone)) {
      return errorResponse('Formato de teléfono inválido', 400)
    }

    if (!purpose || !['registration', 'login', 'password_reset'].includes(purpose)) {
      return errorResponse('Propósito inválido', 400)
    }

    // Check if user exists (for login and password_reset)
    if (purpose === 'login' || purpose === 'password_reset') {
      const user = await prisma.user.findUnique({ where: { phone } })
      if (!user) {
        return errorResponse('No existe una cuenta con este número', 404)
      }
    }

    // Check if user doesn't exist (for registration)
    if (purpose === 'registration') {
      const existingUser = await prisma.user.findUnique({ where: { phone } })
      if (existingUser) {
        return errorResponse('Este número ya está registrado', 409)
      }
    }

    // Generate OTP
    const code = await createOtpCode(phone, purpose)

    // TODO: Send via SMS (Twilio)
    console.log(`📱 OTP para ${phone} (${purpose}): ${code}`)

    // In development, return the code in response
    const isDev = process.env.NODE_ENV !== 'production'

    return successResponse({
      phone,
      expiresIn: 600, // 10 minutes in seconds
      ...(isDev && { debugCode: code }), // Only in development
    }, 'Código de verificación enviado')
  } catch (error) {
    console.error('Error sending OTP:', error)
    return errorResponse('Error al enviar el código', 500)
  }
}
