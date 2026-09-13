import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'PASSENGER') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const {
      originAddress, originLat, originLng,
      destAddress, destLat, destLng,
      scheduledAt, notes,
    } = await request.json()

    if (!originAddress || !destAddress || !scheduledAt) {
      return NextResponse.json({ success: false, error: 'Datos requeridos faltantes' }, { status: 400 })
    }

    const scheduledDate = new Date(scheduledAt)
    if (scheduledDate <= new Date()) {
      return NextResponse.json({ success: false, error: 'La fecha debe ser en el futuro' }, { status: 400 })
    }

    const ride = await prisma.ride.create({
      data: {
        passengerId: user.passengerProfile!.id,
        status: 'SCHEDULED',
        originAddress,
        originLat,
        originLng,
        destAddress,
        destLat,
        destLng,
        estimatedFare: 0,
        distanceKm: 0,
        durationMinutes: 0,
      },
    })

    return NextResponse.json({
      success: true,
      data: ride,
      message: 'Viaje programado exitosamente',
    })
  } catch (error) {
    console.error('Schedule ride error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const where: any = {
      status: 'SCHEDULED',
    }

    if (user.role === 'PASSENGER') {
      where.passengerId = user.passengerProfile?.id
    } else if (user.role === 'DRIVER') {
      where.driverId = user.driverProfile?.id
    }

    const rides = await prisma.ride.findMany({
      where,
      include: {
        passenger: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
        driver: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { requestedAt: 'asc' },
    })

    return NextResponse.json({ success: true, data: rides })
  } catch (error) {
    console.error('Get scheduled rides error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}
