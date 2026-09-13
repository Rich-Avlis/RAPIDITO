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

    // Persist message in DB
    const newMessage = await prisma.message.create({
      data: {
        rideId,
        senderId: user.id,
        content: message,
      },
      include: {
        sender: {
          select: { firstName: true, lastName: true, role: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: newMessage.id,
        senderId: newMessage.senderId,
        senderName: `${newMessage.sender.firstName} ${newMessage.sender.lastName}`,
        senderRole: newMessage.sender.role,
        message: newMessage.content,
        timestamp: newMessage.createdAt.toISOString(),
      },
    })
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

    // Fetch messages from DB
    const messages = await prisma.message.findMany({
      where: { rideId },
      include: {
        sender: {
          select: { firstName: true, lastName: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      senderName: `${msg.sender.firstName} ${msg.sender.lastName}`,
      senderRole: msg.sender.role,
      message: msg.content,
      timestamp: msg.createdAt.toISOString(),
    }))

    return NextResponse.json({ success: true, data: formattedMessages })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}
