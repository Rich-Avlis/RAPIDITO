import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Get driver wallet balance
    if (user.driverProfile) {
      const wallet = await prisma.driverWallet.findUnique({
        where: { driverId: user.driverProfile.id },
      })
      return NextResponse.json({
        success: true,
        data: {
          balance: wallet?.balance || 0,
          pendingBalance: wallet?.pendingBalance || 0,
          totalEarned: wallet?.totalEarned || 0,
          totalWithdrawn: wallet?.totalWithdrawn || 0,
        },
      })
    }

    // For passengers, calculate based on completed rides
    const rideCount = await prisma.ride.count({
      where: { passengerId: user.passengerProfile?.id, status: 'COMPLETED' },
    })

    return NextResponse.json({
      success: true,
      data: {
        balance: rideCount * 0.50,
        pendingBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
      },
    })
  } catch (error) {
    console.error('Get cartera error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { action } = await request.json()

    // Las recargas/pagos del cliente quedan deshabilitados hasta integrar una
    // pasarela de pago verificada: antes cualquier usuario podía acreditarse
    // saldo arbitrario solo enviando { action: 'topup', amount: N }.
    if (action === 'topup' || action === 'pay_driver') {
      return NextResponse.json(
        {
          success: false,
          error: 'Recargas y pagos requieren una pasarela de pago verificada',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Acción inválida' }, { status: 400 })
  } catch (error) {
    console.error('Cartera action error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}
