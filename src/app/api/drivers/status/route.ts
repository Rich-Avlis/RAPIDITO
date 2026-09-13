import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'DRIVER') {
      return unauthorizedResponse('Only drivers can change online status')
    }

    const body = await request.json()
    const { isOnline, lat, lng } = body

    // Check if driver has location when going online
    if (isOnline && (!lat || !lng)) {
      return errorResponse(
        'Para recibir viajes necesitas activar tu ubicación.',
        400
      )
    }

    // Check if driver has required documents approved
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
      include: {
        documents: true,
        vehicle: true,
      },
    })

    if (!driverProfile) {
      return errorResponse('Driver profile not found', 404)
    }

    if (isOnline) {
      // Verify required documents are approved
      const requiredDocs = ['cedula', 'license', 'medical_certificate']
      const approvedDocs = driverProfile.documents
        .filter(d => d.status === 'APPROVED')
        .map(d => d.documentType)

      const missingDocs = requiredDocs.filter(doc => !approvedDocs.includes(doc))
      if (missingDocs.length > 0) {
        return errorResponse(
          `Documents required to go online: ${missingDocs.join(', ')}`,
          400
        )
      }

      // Verify vehicle exists
      if (!driverProfile.vehicle) {
        return errorResponse('Vehicle registration required to go online', 400)
      }
    }

    // Update driver status
    const updatedProfile = await prisma.driverProfile.update({
      where: { userId: user.id },
      data: {
        isOnline: isOnline ? 'ONLINE' : 'OFFLINE',
        isAvailable: isOnline,
        currentLat: isOnline ? lat : null,
        currentLng: isOnline ? lng : null,
      },
    })

    // TODO: Broadcast status change via Socket.IO

    return successResponse({
      isOnline: updatedProfile.isOnline,
      isAvailable: updatedProfile.isAvailable,
    }, isOnline ? 'Estás en línea' : 'Desconectado')
  } catch (error) {
    console.error('Driver status error:', error)
    return errorResponse('Internal server error', 500)
  }
}
