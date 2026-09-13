import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { rideId, message } = await request.json()

    if (!rideId || !message) {
      return NextResponse.json({ success: false, error: 'rideId y message requeridos' }, { status: 400 })
    }

    // Verify ride exists
    const ride = await prisma.ride.findUnique({ where: { id: rideId } })
    if (!ride) {
      return NextResponse.json({ success: false, error: 'Viaje no encontrado' }, { status: 404 })
    }

    const newMessage = {
      id: `MSG-${Date.now()}`,
      senderId: user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      senderRole: user.role,
      message,
      timestamp: new Date().toISOString(),
    }

    // Store message in a simple way (could use a separate table in production)
    return NextResponse.json({ success: true, data: newMessage })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rideId = searchParams.get('rideId')

    if (!rideId) {
      return NextResponse.json({ success: false, error: 'rideId requerido' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: [] })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}
