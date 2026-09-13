import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')

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
          passenger: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
          driver: { include: { user: { select: { firstName: true, lastName: true, phone: true } }, vehicle: true } },
        },
        orderBy: { requestedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ride.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        rides,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Get rides error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}
