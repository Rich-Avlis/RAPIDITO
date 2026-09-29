import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response'

const RIDE_INCLUDE = {
  passenger: {
    include: { user: { select: { firstName: true, lastName: true, phone: true } } },
  },
  driver: {
    include: { user: { select: { firstName: true, lastName: true, phone: true } } },
  },
} as const

const CANCELLABLE_STATUSES = ['REQUESTED', 'SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED']

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    const { id } = await context.params
    const ride = await prisma.ride.findUnique({ where: { id }, include: RIDE_INCLUDE })
    if (!ride) {
      return notFoundResponse('Ride not found')
    }

    const isPassenger = user.role === 'PASSENGER' && ride.passengerId === user.passengerProfile?.id
    const isDriver = user.role === 'DRIVER' && ride.driverId === user.driverProfile?.id
    if (!isPassenger && !isDriver) {
      return forbiddenResponse('You do not have access to this ride')
    }

    return successResponse({ ride })
  } catch (error) {
    console.error('Get ride error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    const { id } = await context.params
    const body = await request.json().catch(() => null)
    const action = body?.action

    const ride = await prisma.ride.findUnique({ where: { id }, include: RIDE_INCLUDE })
    if (!ride) {
      return notFoundResponse('Ride not found')
    }

    // Pasajero: cancelar su viaje
    if (action === 'cancel') {
      if (user.role !== 'PASSENGER' || ride.passengerId !== user.passengerProfile?.id) {
        return forbiddenResponse('Only the passenger can cancel this ride')
      }
      if (!CANCELLABLE_STATUSES.includes(ride.status)) {
        return errorResponse('Este viaje ya no se puede cancelar', 400)
      }
      const cancelled = await prisma.ride.update({
        where: { id },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
        include: RIDE_INCLUDE,
      })
      return successResponse({ ride: cancelled }, 'Viaje cancelado')
    }

    // El resto de acciones son del conductor
    if (user.role !== 'DRIVER') {
      return forbiddenResponse('Only drivers can update this ride')
    }
    const driverProfile = user.driverProfile
    if (!driverProfile) {
      return errorResponse('Driver profile not found', 404)
    }
    if (ride.driverId && ride.driverId !== driverProfile.id) {
      return forbiddenResponse('Este viaje no te está asignado')
    }

    let data: Record<string, unknown>
    let message: string

    switch (action) {
      case 'accept':
        if (driverProfile.isOnline !== 'ONLINE') {
          return errorResponse('Debes estar en línea para aceptar viajes', 400)
        }
        // Asignación atómica: solo un conductor puede tomarlo
        const taken = await prisma.ride.updateMany({
          where: { id, status: 'SEARCHING_DRIVER', driverId: null },
          data: {
            driverId: driverProfile.id,
            status: 'DRIVER_ASSIGNED',
            assignedAt: new Date(),
          },
        })
        if (taken.count === 0) {
          return errorResponse('Este viaje ya fue tomado por otro conductor', 409)
        }
        return successResponse(
          { ride: await prisma.ride.findUnique({ where: { id }, include: RIDE_INCLUDE }) },
          'Viaje aceptado'
        )

      case 'arrive':
        if (ride.status !== 'DRIVER_ASSIGNED') {
          return errorResponse('Acción no válida para el estado actual del viaje', 400)
        }
        data = { status: 'DRIVER_ARRIVED', arrivedAt: new Date() }
        message = 'Llegaste al punto de recogida'
        break

      case 'start':
        if (ride.status !== 'DRIVER_ARRIVED') {
          return errorResponse('Acción no válida para el estado actual del viaje', 400)
        }
        data = { status: 'TRIP_STARTED', startedAt: new Date() }
        message = 'Viaje iniciado'
        break

      case 'complete':
        if (ride.status !== 'TRIP_STARTED') {
          return errorResponse('Acción no válida para el estado actual del viaje', 400)
        }
        data = {
          status: 'COMPLETED',
          completedAt: new Date(),
          finalFare: ride.finalFare ?? ride.estimatedFare,
        }
        message = 'Viaje finalizado'
        break

      default:
        return errorResponse('Acción no válida', 400)
    }

    const updated = await prisma.ride.update({ where: { id }, data, include: RIDE_INCLUDE })

    // Estadísticas al finalizar
    if (action === 'complete') {
      await Promise.all([
        prisma.driverProfile.update({
          where: { id: driverProfile.id },
          data: { completedTrips: { increment: 1 }, tripCount: { increment: 1 }, isAvailable: true },
        }),
        prisma.passengerProfile.update({
          where: { id: ride.passengerId },
          data: { tripCount: { increment: 1 } },
        }),
      ])
    }

    return successResponse({ ride: updated }, message)
  } catch (error) {
    console.error('Ride update error:', error)
    return errorResponse('Internal server error', 500)
  }
}
