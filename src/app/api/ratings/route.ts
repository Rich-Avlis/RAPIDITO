import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { ratingSchema } from '@/lib/validations'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'
import { removeAccents } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const validatedData = ratingSchema.parse(body)

    // Get the ride
    const ride = await prisma.ride.findUnique({
      where: { id: validatedData.rideId },
      include: {
        passenger: {
          include: { user: { select: { id: true } } },
        },
        driver: {
          include: { user: { select: { id: true } } },
        },
        ratings: true,
      },
    })

    if (!ride) {
      return errorResponse('Ride not found', 404)
    }

    if (ride.status !== 'COMPLETED') {
      return errorResponse('Can only rate completed rides', 400)
    }

    // Check if user already rated this ride
    const existingRating = ride.ratings.find(r => r.raterId === user.id)
    if (existingRating) {
      return errorResponse('You have already rated this ride', 400)
    }

    // Determine who is being rated
    let ratedId: string
    let driverRatedId: string | undefined

    if (user.role === 'PASSENGER' && ride.driverId) {
      // Passenger rating driver
      ratedId = ride.driver!.user.id
      driverRatedId = ride.driverId
    } else if (user.role === 'DRIVER' && ride.passengerId) {
      // Driver rating passenger
      ratedId = ride.passenger!.user.id
    } else {
      return errorResponse('Unable to determine who to rate', 400)
    }

    // Create rating
    const rating = await prisma.rating.create({
      data: {
        rideId: validatedData.rideId,
        raterId: user.id,
        ratedId,
        driverRaterId: user.role === 'DRIVER' ? user.driverProfile?.id : undefined,
        driverRatedId,
        score: validatedData.score,
        comment: validatedData.comment ? removeAccents(validatedData.comment) : undefined,
      },
    })

    // Update average rating for the rated user
    if (user.role === 'PASSENGER' && ride.driverId) {
      // Update driver's average rating
      const driverRatings = await prisma.rating.findMany({
        where: { driverRatedId: ride.driverId },
      })

      const avgRating = driverRatings.reduce((sum, r) => sum + r.score, 0) / driverRatings.length

      await prisma.driverProfile.update({
        where: { id: ride.driverId },
        data: {
          rating: Math.round(avgRating * 10) / 10,
          totalRatings: driverRatings.length,
        },
      })
    }

    return successResponse({ rating }, 'Rating submitted successfully')
  } catch (error) {
    console.error('Rating error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return errorResponse('Validation failed: ' + error.message, 422)
    }
    return errorResponse('Internal server error', 500)
  }
}
