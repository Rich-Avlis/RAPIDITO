import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

    const { action, amount, paymentMethod } = await request.json()

    if (action === 'topup' && amount > 0) {
      // Top up cartera
      if (user.driverProfile) {
        const wallet = await prisma.driverWallet.upsert({
          where: { driverId: user.driverProfile.id },
          update: { balance: { increment: amount } },
          create: { driverId: user.driverProfile.id, balance: amount },
        })

        await prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'BONUS',
            amount,
            description: `Recarga de cartera vía ${paymentMethod || 'Pago Móvil'}`,
          },
        })

        return NextResponse.json({ success: true, data: wallet })
      }

      return NextResponse.json({ success: true, message: 'Recarga registrada' })
    }

    if (action === 'pay_driver' && amount > 0) {
      // Pay driver from passenger cartera
      // This would deduct from passenger balance and add to driver
      return NextResponse.json({ success: true, message: 'Pago procesado' })
    }

    return NextResponse.json({ success: false, error: 'Acción inválida' }, { status: 400 })
  } catch (error) {
    console.error('Cartera action error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}
