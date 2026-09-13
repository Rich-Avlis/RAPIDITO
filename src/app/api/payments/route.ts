import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { paymentSchema } from '@/lib/validations'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const validatedData = paymentSchema.parse(body)

    // Get the ride
    const ride = await prisma.ride.findUnique({
      where: { id: validatedData.rideId },
      include: {
        payment: true,
        driver: { include: { wallet: true } },
      },
    })

    if (!ride) {
      return errorResponse('Ride not found', 404)
    }

    if (ride.status !== 'TRIP_COMPLETED') {
      return errorResponse('Ride has not been completed', 400)
    }

    if (ride.payment) {
      return errorResponse('Payment already exists for this ride', 400)
    }

    // Validate PagoMóvil reference
    if (validatedData.method === 'PAGOMOVIL' && !validatedData.pagomovilRef) {
      return errorResponse('PagoMóvil reference is required', 400)
    }

    const finalFare = ride.finalFare || ride.estimatedFare
    const commissionRate = 0.1 // 10% commission (configurable)
    const commission = finalFare * commissionRate
    const netAmount = finalFare - commission

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        rideId: validatedData.rideId,
        method: validatedData.method,
        status: validatedData.method === 'CASH' ? 'VERIFIED' : 'SUBMITTED',
        amount: finalFare,
        commission,
        netAmount,
        pagomovilRef: validatedData.pagomovilRef,
      },
    })

    // If cash payment, immediately update driver wallet
    if (validatedData.method === 'CASH' && ride.driver?.wallet) {
      await prisma.driverWallet.update({
        where: { id: ride.driver.wallet.id },
        data: {
          balance: { increment: netAmount },
          pendingBalance: { increment: netAmount },
          totalEarned: { increment: finalFare },
          totalCommission: { increment: commission },
        },
      })

      // Create wallet transaction
      await prisma.walletTransaction.create({
        data: {
          walletId: ride.driver.wallet.id,
          type: 'RIDE_EARNING',
          amount: netAmount,
          description: `Ride #${ride.id.slice(0, 8)} earning`,
          rideId: ride.id,
        },
      })

      // Create commission transaction
      await prisma.walletTransaction.create({
        data: {
          walletId: ride.driver.wallet.id,
          type: 'COMMISSION',
          amount: -commission,
          description: `Commission for ride #${ride.id.slice(0, 8)}`,
          rideId: ride.id,
        },
      })
    }

    // Update ride status
    await prisma.ride.update({
      where: { id: ride.id },
      data: { status: 'COMPLETED' },
    })

    // Update driver stats
    if (ride.driverId) {
      await prisma.driverProfile.update({
        where: { id: ride.driverId },
        data: {
          completedTrips: { increment: 1 },
          tripCount: { increment: 1 },
          isAvailable: true,
        },
      })
    }

    // Update passenger stats
    await prisma.passengerProfile.update({
      where: { id: ride.passengerId },
      data: {
        tripCount: { increment: 1 },
      },
    })

    // TODO: Send notification to driver about payment

    return successResponse({
      payment,
      message: validatedData.method === 'CASH'
        ? 'Payment confirmed. Thank you!'
        : 'PagoMóvil reference submitted. Pending verification.',
    }, 'Payment processed successfully')
  } catch (error) {
    console.error('Payment error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return errorResponse('Validation failed: ' + error.message, 422)
    }
    return errorResponse('Internal server error', 500)
  }
}
