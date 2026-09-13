import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'PASSENGER') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { rideId, amount, paymentMethod } = await request.json()

    if (!rideId || !amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 })
    }

    // Get the ride
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true },
    })

    if (!ride) {
      return NextResponse.json({ success: false, error: 'Viaje no encontrado' }, { status: 404 })
    }

    if (ride.status !== 'COMPLETED') {
      return NextResponse.json({ success: false, error: 'Solo puedes propinar viajes completados' }, { status: 400 })
    }

    if (ride.passengerId !== user.passengerProfile?.id) {
      return NextResponse.json({ success: false, error: 'No es tu viaje' }, { status: 403 })
    }

    // Add to driver wallet
    if (ride.driverId) {
      await prisma.driverWallet.upsert({
        where: { driverId: ride.driverId },
        update: {
          balance: { increment: amount },
          totalEarned: { increment: amount },
        },
        create: {
          driverId: ride.driverId,
          balance: amount,
          totalEarned: amount,
        },
      })

      // Create wallet transaction
      await prisma.walletTransaction.create({
        data: {
          walletId: ride.driverId,
          type: 'BONUS',
          amount,
          description: 'Propina del pasajero',
        },
      })
    }

    return NextResponse.json({ success: true, message: 'Propina enviada' })
  } catch (error) {
    console.error('Tip error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}
