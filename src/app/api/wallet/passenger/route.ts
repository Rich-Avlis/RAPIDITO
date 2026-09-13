import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // For now, return a simple wallet based on ride history
    const rideCount = await prisma.ride.count({
      where: { passengerId: user.passengerProfile?.id, status: 'COMPLETED' },
    })

    const balance = rideCount * 0.50 // $0.50 credit per completed ride

    return NextResponse.json({
      success: true,
      data: {
        balance,
        pendingBalance: 0,
        transactions: [],
      },
    })
  } catch (error) {
    console.error('Get wallet error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}
