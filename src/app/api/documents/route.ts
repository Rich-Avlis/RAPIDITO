import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { documentUploadSchema } from '@/lib/validations'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'DRIVER') {
      return unauthorizedResponse('Only drivers can upload documents')
    }

    const body = await request.json()
    const validatedData = documentUploadSchema.parse(body)

    // Validate document type
    const allowedDocTypes = [
      'cedula',
      'license',
      'medical_certificate',
      'vehicle_registration',
      'soat',
      'tax_receipt',
      'helmet_conductor',
      'helmet_passenger',
      'vehicle_photo_front',
      'vehicle_photo_back',
      'vehicle_photo_side',
      'driver_photo',
    ]

    if (!allowedDocTypes.includes(validatedData.documentType)) {
      return errorResponse('Invalid document type', 400)
    }

    // TODO: Handle actual file upload to S3
    // For now, simulate file URL
    const fileUrl = `/uploads/documents/${user.id}/${validatedData.documentType}_${Date.now()}.jpg`

    // Check if it's a vehicle document
    const isVehicleDoc = [
      'vehicle_registration',
      'soat',
      'tax_receipt',
      'vehicle_photo_front',
      'vehicle_photo_back',
      'vehicle_photo_side',
    ].includes(validatedData.documentType)

    if (isVehicleDoc) {
      // Get driver's vehicle
      const driverProfile = await prisma.driverProfile.findUnique({
        where: { userId: user.id },
        include: { vehicle: true },
      })

      if (!driverProfile?.vehicle) {
        return errorResponse('Vehicle not registered. Please register your vehicle first.', 400)
      }

      // Create vehicle document
      const doc = await prisma.vehicleDocument.create({
        data: {
          vehicleId: driverProfile.vehicle.id,
          documentType: validatedData.documentType,
          fileName: validatedData.fileName,
          fileUrl,
          status: 'PENDING',
          expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
        },
      })

      return successResponse({ document: doc }, 'Document uploaded successfully. Pending review.')
    }

    // Create driver document
    const doc = await prisma.driverDocument.create({
      data: {
        driverId: user.driverProfile!.id,
        documentType: validatedData.documentType,
        fileName: validatedData.fileName,
        fileUrl,
        status: 'PENDING',
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
      },
    })

    return successResponse({ document: doc }, 'Document uploaded successfully. Pending review.')
  } catch (error) {
    console.error('Document upload error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return errorResponse('Validation failed: ' + error.message, 422)
    }
    return errorResponse('Internal server error', 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        vehicle: {
          include: {
            documents: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    })

    if (!driverProfile) {
      return errorResponse('Driver profile not found', 404)
    }

    const allDocuments = [
      ...driverProfile.documents.map(doc => ({
        ...doc,
        category: 'driver',
      })),
      ...(driverProfile.vehicle?.documents.map(doc => ({
        ...doc,
        category: 'vehicle',
      })) || []),
    ]

    // Calculate progress
    const requiredDocs = ['cedula', 'license', 'medical_certificate']
    const approvedCount = allDocuments.filter(
      d => requiredDocs.includes(d.documentType) && d.status === 'APPROVED'
    ).length

    return successResponse({
      documents: allDocuments,
      progress: {
        approved: approvedCount,
        total: requiredDocs.length,
        percentage: Math.round((approvedCount / requiredDocs.length) * 100),
      },
    })
  } catch (error) {
    console.error('Get documents error:', error)
    return errorResponse('Internal server error', 500)
  }
}
