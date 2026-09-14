import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'DRIVER') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { photo } = await request.json()

    if (!photo) {
      return NextResponse.json({ success: false, error: 'Foto requerida' }, { status: 400 })
    }

    // Validate base64 size (max 5MB)
    const base64Data = photo.split(',')[1] || photo
    const sizeInBytes = (base64Data.length * 3) / 4
    if (sizeInBytes > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'La foto no puede ser mayor a 5MB' }, { status: 400 })
    }

    // Save photo to user profile
    await prisma.user.update({
      where: { id: user.id },
      data: { profilePhoto: photo },
    })

    return NextResponse.json({ success: true, message: 'Foto actualizada' })
  } catch (error) {
    console.error('Upload photo error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}
