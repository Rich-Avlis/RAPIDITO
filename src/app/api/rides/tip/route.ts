import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const MIN_TIP = 0.25
const MAX_TIP = 5

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'PASSENGER') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { rideId, amount } = await request.json()

    const tipAmount = Math.round(Number(amount) * 100) / 100
    if (!rideId || typeof rideId !== 'string') {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 })
    }

    if (!Number.isFinite(tipAmount) || tipAmount < MIN_TIP || tipAmount > MAX_TIP) {
      return NextResponse.json(
        { success: false, error: `La propina debe estar entre $${MIN_TIP} y $${MAX_TIP}` },
        { status: 400 }
      )
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

    if (!ride.driverId) {
      return NextResponse.json({ success: false, error: 'Este viaje no tiene conductor' }, { status: 400 })
    }

    // Only one tip per ride (evita inflar el saldo del conductor a voluntad)
    const existingTip = await prisma.walletTransaction.findFirst({
      where: { rideId: ride.id, type: 'BONUS', description: 'Propina del pasajero' },
    })
    if (existingTip) {
      return NextResponse.json({ success: false, error: 'Ya enviaste una propina para este viaje' }, { status: 400 })
    }

    // Add to driver wallet
    const wallet = await prisma.driverWallet.upsert({
      where: { driverId: ride.driverId },
      update: {
        balance: { increment: tipAmount },
        totalEarned: { increment: tipAmount },
      },
      create: {
        driverId: ride.driverId,
        balance: tipAmount,
        totalEarned: tipAmount,
      },
    })

    // Create wallet transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        rideId: ride.id,
        type: 'BONUS',
        amount: tipAmount,
        description: 'Propina del pasajero',
      },
    })

    return NextResponse.json({ success: true, message: 'Propina enviada' })
  } catch (error) {
    console.error('Tip error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}
