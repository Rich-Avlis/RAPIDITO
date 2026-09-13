import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { rideRequestSchema } from '@/lib/validations'
import { calculateFare, calculateDistance, calculateEta } from '@/services/fare'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'PASSENGER') {
      return unauthorizedResponse('Only passengers can request rides')
    }

    const body = await request.json()
    const validatedData = rideRequestSchema.parse(body)

    // Calculate distance and duration
    const distance = calculateDistance(
      validatedData.originLat,
      validatedData.originLng,
      validatedData.destLat,
      validatedData.destLng
    )

    const duration = calculateEta(distance)

    // Calculate fare
    const fare = await calculateFare(
      { lat: validatedData.originLat, lng: validatedData.originLng },
      { lat: validatedData.destLat, lng: validatedData.destLng },
      distance,
      duration,
      validatedData.originAddress,
      validatedData.destAddress
    )

    // Create ride
    const ride = await prisma.ride.create({
      data: {
        passengerId: user.passengerProfile!.id,
        status: 'SEARCHING_DRIVER',
        originAddress: validatedData.originAddress,
        originLat: validatedData.originLat,
        originLng: validatedData.originLng,
        destAddress: validatedData.destAddress,
        destLat: validatedData.destLat,
        destLng: validatedData.destLng,
        estimatedFare: fare.total,
        distanceKm: distance,
        durationMinutes: duration,
      },
      include: {
        passenger: {
          include: { user: true },
        },
      },
    })

    // TODO: Find nearby drivers and notify them
    // This would be handled by the real-time system (Socket.IO)

    return successResponse({
      ride,
      fare: {
        distance: Math.round(distance * 100) / 100,
        duration,
        estimatedFare: fare.total,
        breakdown: fare,
      },
    }, 'Ride requested successfully')
  } catch (error) {
    console.error('Ride request error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return errorResponse('Validation failed: ' + error.message, 422)
    }
    return errorResponse('Internal server error', 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {}
    
    if (user.role === 'PASSENGER') {
      where.passengerId = user.passengerProfile?.id
    } else if (user.role === 'DRIVER') {
      where.driverId = user.driverProfile?.id
    }

    if (status) {
      where.status = status
    }

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where,
        include: {
          passenger: {
            include: { user: { select: { firstName: true, lastName: true, phone: true } } },
          },
          driver: {
            include: { user: { select: { firstName: true, lastName: true, phone: true } } },
          },
          payment: true,
          ratings: true,
        },
        orderBy: { requestedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ride.count({ where }),
    ])

    return successResponse({
      rides,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get rides error:', error)
    return errorResponse('Internal server error', 500)
  }
}
