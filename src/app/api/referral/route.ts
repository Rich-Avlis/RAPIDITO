import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { code } = await request.json()
    if (!code) {
      return NextResponse.json({ success: false, error: 'Código requerido' }, { status: 400 })
    }

    // Find the referrer by code
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code }
    })

    if (!referrer) {
      return NextResponse.json({ success: false, error: 'Código inválido' }, { status: 400 })
    }

    if (referrer.id === user.id) {
      return NextResponse.json({ success: false, error: 'No puedes usar tu propio código' }, { status: 400 })
    }

    // Check if already referred
    const existingReferral = await prisma.referral.findFirst({
      where: {
        referrerId: referrer.id,
        referredId: user.id
      }
    })

    if (existingReferral) {
      return NextResponse.json({ success: false, error: 'Ya usaste este código' }, { status: 400 })
    }

    // Create referral record
    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: user.id,
        code: code,
        rewardAmount: 0
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: { 
        referralId: referral.id,
        discountPercentage: 10,
        totalRides: 2
      } 
    })

  } catch (error) {
    console.error('Referral error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Get user's referral code and stats
    const referralUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { referralCode: true }
    })

    // Count referrals made
    const referralsMade = await prisma.referral.count({
      where: { referrerId: user.id }
    })

    // Count rides completed
    const ridesCompleted = await prisma.ride.count({
      where: { 
        passengerId: user.id,
        status: 'COMPLETED'
      }
    })

    // Check how many referral discounts used (from ride metadata)
    const referralDiscountsUsed = 0 // Will be tracked in ride metadata

    return NextResponse.json({
      success: true,
      data: {
        referralCode: referralUser?.referralCode,
        referralsMade,
        ridesCompleted,
        referralDiscountsUsed,
        referralDiscountsAvailable: Math.max(0, 2 - referralDiscountsUsed),
        firstRideDiscountsAvailable: Math.max(0, 2 - ridesCompleted)
      }
    })

  } catch (error) {
    console.error('Get referral error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}
