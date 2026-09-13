import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, createSession, createOtpCode } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { removeAccents, cleanEmail, cleanPlate } from '@/lib/utils'

interface RegisterBody {
  firstName: string
  lastName: string
  phone: string
  email: string
  password: string
  role: 'PASSENGER' | 'DRIVER'
  vehicle?: {
    type: string
    brand: string
    model: string
    color: string
    plateNumber: string
    year?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterBody = await request.json()

    // ==========================================
    // 1. VALIDACIONES BÁSICAS
    // ==========================================

    if (!body.firstName?.trim()) {
      return errorResponse('El nombre es requerido', 400)
    }

    if (!body.lastName?.trim()) {
      return errorResponse('El apellido es requerido', 400)
    }

    if (!body.phone?.trim()) {
      return errorResponse('El teléfono es requerido', 400)
    }

    // Validate phone format (+58XXXXXXXXXX)
    const phoneRegex = /^\+58\d{10}$/
    if (!phoneRegex.test(body.phone)) {
      return errorResponse('Formato de teléfono inválido. Ejemplo: +5804141234567', 400)
    }

    if (!body.email?.trim()) {
      return errorResponse('El correo electrónico es requerido', 400)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return errorResponse('Formato de correo electrónico inválido', 400)
    }

    if (!body.password) {
      return errorResponse('La contraseña es requerida', 400)
    }

    if (body.password.length < 8) {
      return errorResponse('La contraseña debe tener al menos 8 caracteres', 400)
    }

    if (!['PASSENGER', 'DRIVER'].includes(body.role)) {
      return errorResponse('Rol inválido', 400)
    }

    // ==========================================
    // 2. VALIDACIONES PARA CONDUCTORES
    // ==========================================

    if (body.role === 'DRIVER') {
      if (!body.vehicle) {
        return errorResponse('La información del vehículo es requerida para conductores', 400)
      }

      if (!body.vehicle.brand?.trim()) {
        return errorResponse('La marca del vehículo es requerida', 400)
      }

      if (!body.vehicle.model?.trim()) {
        return errorResponse('El modelo del vehículo es requerido', 400)
      }

      if (!body.vehicle.color?.trim()) {
        return errorResponse('El color del vehículo es requerido', 400)
      }

      if (!body.vehicle.plateNumber?.trim()) {
        return errorResponse('La placa del vehículo es requerida', 400)
      }
    }

    // ==========================================
    // 3. VERIFICAR DUPLICADOS
    // ==========================================

    // Check phone
    const existingPhone = await prisma.user.findUnique({
      where: { phone: body.phone },
    })

    if (existingPhone) {
      return errorResponse('Este número telefónico ya está registrado', 409)
    }

    // Check email
    const cleanedEmail = cleanEmail(body.email)
    const existingEmail = await prisma.user.findUnique({
      where: { email: cleanedEmail },
    })

    if (existingEmail) {
      return errorResponse('Este correo electrónico ya está registrado', 409)
    }

    // ==========================================
    // 4. CREAR USUARIO
    // ==========================================

    const passwordHash = await hashPassword(body.password)

    const user = await prisma.user.create({
      data: {
        firstName: removeAccents(body.firstName),
        lastName: removeAccents(body.lastName),
        phone: body.phone,
        email: cleanedEmail,
        passwordHash,
        role: body.role,
      },
    })

    // ==========================================
    // 5. CREAR PERFIL SEGÚN ROL
    // ==========================================

    if (body.role === 'PASSENGER') {
      await prisma.passengerProfile.create({
        data: { userId: user.id },
      })
    }

    if (body.role === 'DRIVER' && body.vehicle) {
      // Create driver profile
      const driverProfile = await prisma.driverProfile.create({
        data: { userId: user.id },
      })

      // Get or create vehicle type
      let vehicleType = await prisma.vehicleType.findFirst({
        where: { name: body.vehicle.type || 'moto' },
      })

      if (!vehicleType) {
        vehicleType = await prisma.vehicleType.create({
          data: {
            name: body.vehicle.type || 'moto',
            displayName: body.vehicle.type === 'car' ? 'Automóvil' : 'Motocicleta',
          },
        })
      }

      // Create vehicle
      await prisma.vehicle.create({
        data: {
          driverId: driverProfile.id,
          vehicleTypeId: vehicleType.id,
          brand: removeAccents(body.vehicle.brand),
          model: removeAccents(body.vehicle.model),
          color: removeAccents(body.vehicle.color),
          plateNumber: cleanPlate(body.vehicle.plateNumber),
          year: body.vehicle.year || null,
        },
      })

      // Create wallet for driver
      await prisma.driverWallet.create({
        data: { driverId: driverProfile.id },
      })
    }

    // ==========================================
    // 6. GENERAR OTP PARA VERIFICACIÓN
    // ==========================================

    const otpCode = await createOtpCode(body.phone, 'registration')

    // TODO: Send OTP via SMS (Twilio)
    console.log(`📱 OTP para ${body.phone}: ${otpCode}`)

    // ==========================================
    // 7. CREAR SESIÓN
    // ==========================================

    const session = await createSession(
      user.id,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    )

    // ==========================================
    // 8. RESPUESTA EXITOSA
    // ==========================================

    const response = successResponse({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      requiresVerification: true,
      message: 'Cuenta creada exitosamente. Verifica tu número telefónico.',
    })

    // Set HTTP-only cookies
    response.cookies.set('access_token', session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    })

    response.cookies.set('refresh_token', session.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    console.log(`✅ Usuario registrado: ${user.email} (${user.role})`)

    return response
  } catch (error) {
    console.error('❌ Error en registro:', error)
    return errorResponse('Error interno del servidor', 500)
  }
}
