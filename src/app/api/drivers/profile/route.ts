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
        license: {
          number: profile?.licenseNumber || '',
          expiry: profile?.licenseExpiry ? profile.licenseExpiry.toISOString().split('T')[0] : '',
        },
        payment: {
          bank: profile?.paymentBank || '',
          phone: profile?.paymentPhone || '',
          cedula: profile?.paymentCedula || '',
          name: profile?.paymentName || '',
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

    // Update user info (name, email only)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      },
    })

    // Update license and payment data on DriverProfile
    await prisma.driverProfile.update({
      where: { userId: user.id },
      data: {
        licenseNumber: data.license?.number || null,
        licenseExpiry: data.license?.expiry ? new Date(data.license.expiry) : null,
        paymentBank: data.payment?.bank || null,
        paymentPhone: data.payment?.phone || null,
        paymentCedula: data.payment?.cedula || null,
        paymentName: data.payment?.name || null,
      },
    })

    // Vehicle data is read-only from registration - do NOT update here
    // Vehicle must match registration data exactly

    return NextResponse.json({ success: true, message: 'Perfil actualizado' })
  } catch (error) {
    console.error('Update driver profile error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}
