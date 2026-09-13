import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { negotiationSchema } from '@/lib/validations'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const validatedData = negotiationSchema.parse(body)

    // Get the ride
    const ride = await prisma.ride.findUnique({
      where: { id: validatedData.rideId },
      include: {
        passenger: true,
        driver: true,
        negotiation: true,
      },
    })

    if (!ride) {
      return errorResponse('Ride not found', 404)
    }

    // Check if there's already an active negotiation
    if (ride.negotiation && ride.negotiation.status === 'PENDING') {
      return errorResponse('There is already an active negotiation for this ride', 400)
    }

    // Validate the offer is within acceptable range
    const minFare = ride.estimatedFare * 0.5 // 50% minimum
    const maxFare = ride.estimatedFare * 2 // 200% maximum

    if (validatedData.offeredFare < minFare || validatedData.offeredFare > maxFare) {
      return errorResponse(
        `Offer must be between $${minFare.toFixed(2)} and $${maxFare.toFixed(2)}`,
        400
      )
    }

    // Create negotiation
    const negotiation = await prisma.rideNegotiation.create({
      data: {
        rideId: validatedData.rideId,
        passengerId: user.passengerProfile!.id,
        driverId: ride.driverId!,
        suggestedFare: ride.estimatedFare,
        offeredFare: validatedData.offeredFare,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
      },
    })

    // TODO: Notify driver of new offer via Socket.IO

    return successResponse({ negotiation }, 'Offer submitted successfully')
  } catch (error) {
    console.error('Negotiation error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return errorResponse('Validation failed: ' + error.message, 422)
    }
    return errorResponse('Internal server error', 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'DRIVER') {
      return unauthorizedResponse('Only drivers can respond to negotiations')
    }

    const body = await request.json()
    const { negotiationId, action, counterOffer } = body

    if (!negotiationId || !action) {
      return errorResponse('negotiationId and action are required', 400)
    }

    const negotiation = await prisma.rideNegotiation.findUnique({
      where: { id: negotiationId },
      include: { ride: true },
    })

    if (!negotiation) {
      return errorResponse('Negotiation not found', 404)
    }

    if (negotiation.status !== 'PENDING') {
      return errorResponse('Negotiation is no longer active', 400)
    }

    if (negotiation.expiresAt < new Date()) {
      await prisma.rideNegotiation.update({
        where: { id: negotiationId },
        data: { status: 'EXPIRED' },
      })
      return errorResponse('Negotiation has expired', 400)
    }

    let newStatus: string
    switch (action) {
      case 'ACCEPT':
        newStatus = 'ACCEPTED'
        // Update ride with negotiated fare
        await prisma.ride.update({
          where: { id: negotiation.rideId },
          data: { finalFare: negotiation.offeredFare! },
        })
        break
      case 'REJECT':
        newStatus = 'REJECTED'
        break
      case 'COUNTER':
        if (!counterOffer) {
          return errorResponse('Counter offer amount is required', 400)
        }
        newStatus = 'COUNTERED'
        await prisma.rideNegotiation.update({
          where: { id: negotiationId },
          data: {
            status: 'COUNTERED',
            counterOffer,
          },
        })
        // TODO: Notify passenger of counter offer
        return successResponse({ status: 'COUNTERED', counterOffer }, 'Counter offer sent')
      default:
        return errorResponse('Invalid action', 400)
    }

    await prisma.rideNegotiation.update({
      where: { id: negotiationId },
      data: { status: newStatus as any },
    })

    // TODO: Notify passenger of response via Socket.IO

    return successResponse({ status: newStatus }, `Negotiation ${newStatus.toLowerCase()}`)
  } catch (error) {
    console.error('Negotiation response error:', error)
    return errorResponse('Internal server error', 500)
  }
}
