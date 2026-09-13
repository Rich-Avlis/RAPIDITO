import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { driverLocationSchema } from '@/lib/validations'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'DRIVER') {
      return unauthorizedResponse('Only drivers can update location')
    }

    const body = await request.json()
    const validatedData = driverLocationSchema.parse(body)

    // Update driver location
    const driverProfile = await prisma.driverProfile.update({
      where: { userId: user.id },
      data: {
        currentLat: validatedData.lat,
        currentLng: validatedData.lng,
      },
    })

    // If driver has an active ride, update ride location
    const activeRide = await prisma.ride.findFirst({
      where: {
        driverId: driverProfile.id,
        status: { in: ['DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'TRIP_STARTED'] },
      },
    })

    if (activeRide) {
      await prisma.rideLocation.upsert({
        where: { rideId: activeRide.id },
        create: {
          rideId: activeRide.id,
          driverLat: validatedData.lat,
          driverLng: validatedData.lng,
          bearing: validatedData.bearing,
          speed: validatedData.speed,
        },
        update: {
          driverLat: validatedData.lat,
          driverLng: validatedData.lng,
          bearing: validatedData.bearing,
          speed: validatedData.speed,
          updatedAt: new Date(),
        },
      })
    }

    // TODO: Broadcast location via Socket.IO to passengers

    return successResponse({ updated: true }, 'Location updated')
  } catch (error) {
    console.error('Location update error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return errorResponse('Validation failed: ' + error.message, 422)
    }
    return errorResponse('Internal server error', 500)
  }
}
