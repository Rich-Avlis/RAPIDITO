import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'DRIVER') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const profile = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
      include: {
        vehicle: true,
        wallet: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        photo: user.profilePhoto || '',
        vehicle: profile?.vehicle || {
          brand: '',
          model: '',
          color: '',
          plateNumber: '',
          year: '',
          type: 'moto',
        },
      },
    })
  } catch (error) {
    console.error('Get driver profile error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'DRIVER') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()

    // Update user info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      },
    })

    // Update or create vehicle
    if (data.vehicle) {
      const profile = await prisma.driverProfile.findUnique({
        where: { userId: user.id },
        include: { vehicle: true },
      })

      if (profile) {
        if (profile.vehicle) {
          await prisma.vehicle.update({
            where: { driverId: profile.id },
            data: {
              brand: data.vehicle.brand,
              model: data.vehicle.model,
              color: data.vehicle.color,
              plateNumber: data.vehicle.plateNumber,
              year: data.vehicle.year ? parseInt(data.vehicle.year) : null,
            },
          })
        } else {
          // Get moto type
          const motoType = await prisma.vehicleType.findFirst({ where: { name: data.vehicle.type || 'moto' } })
          if (motoType) {
            await prisma.vehicle.create({
              data: {
                driverId: profile.id,
                vehicleTypeId: motoType.id,
                brand: data.vehicle.brand,
                model: data.vehicle.model,
                color: data.vehicle.color,
                plateNumber: data.vehicle.plateNumber,
                year: data.vehicle.year ? parseInt(data.vehicle.year) : null,
              },
            })
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Perfil actualizado' })
  } catch (error) {
    console.error('Update driver profile error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}
