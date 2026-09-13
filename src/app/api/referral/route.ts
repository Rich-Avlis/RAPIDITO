import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rapidito-secret-key-2024') as { userId: string }
    
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

    if (referrer.id === decoded.userId) {
      return NextResponse.json({ success: false, error: 'No puedes usar tu propio código' }, { status: 400 })
    }

    // Check if already referred
    const existingReferral = await prisma.referral.findFirst({
      where: {
        referrerId: referrer.id,
        referredId: decoded.userId
      }
    })

    if (existingReferral) {
      return NextResponse.json({ success: false, error: 'Ya usaste este código' }, { status: 400 })
    }

    // Create referral record
    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: decoded.userId,
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

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rapidito-secret-key-2024') as { userId: string }

    // Get user's referral code and stats
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { referralCode: true }
    })

    // Count referrals made
    const referralsMade = await prisma.referral.count({
      where: { referrerId: decoded.userId }
    })

    // Count rides completed
    const ridesCompleted = await prisma.ride.count({
      where: { 
        passengerId: decoded.userId,
        status: 'COMPLETED'
      }
    })

    // Check how many referral discounts used (from ride metadata)
    const referralDiscountsUsed = 0 // Will be tracked in ride metadata

    return NextResponse.json({
      success: true,
      data: {
        referralCode: user?.referralCode,
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
