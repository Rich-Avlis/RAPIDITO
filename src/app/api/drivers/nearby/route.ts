import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { calculateDistance } from '@/services/fare'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'PASSENGER') {
      return unauthorizedResponse('Only passengers can search for drivers')
    }

    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const radius = parseFloat(searchParams.get('radius') || '5') // Default 5km

    if (!lat || !lng) {
      return errorResponse('Location coordinates are required', 400)
    }

    // Get online drivers with location
    const onlineDrivers = await prisma.driverProfile.findMany({
      where: {
        isOnline: 'ONLINE',
        isAvailable: true,
        currentLat: { not: null },
        currentLng: { not: null },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            profilePhoto: true,
          },
        },
        vehicle: {
          include: { type: true },
        },
      },
    })

    // Filter by radius and calculate distance
    const nearbyDrivers = onlineDrivers
      .map(driver => {
        const distance = calculateDistance(
          lat,
          lng,
          driver.currentLat!,
          driver.currentLng!
        )
        return {
          id: driver.id,
          firstName: driver.user.firstName,
          lastName: driver.user.lastName,
          profilePhoto: driver.user.profilePhoto,
          rating: driver.rating,
          completedTrips: driver.completedTrips,
          vehicle: driver.vehicle
            ? {
                brand: driver.vehicle.brand,
                model: driver.vehicle.model,
                color: driver.vehicle.color,
                plateNumber: driver.vehicle.plateNumber.slice(0, 3) + '•••',
                type: driver.vehicle.type?.displayName,
              }
            : null,
          distance: Math.round(distance * 100) / 100,
          eta: Math.ceil(distance * 2), // Rough ETA estimate
          currentLat: driver.currentLat,
          currentLng: driver.currentLng,
        }
      })
      .filter(driver => driver.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10) // Limit to 10 nearest drivers

    return successResponse({ drivers: nearbyDrivers })
  } catch (error) {
    console.error('Search drivers error:', error)
    return errorResponse('Internal server error', 500)
  }
}
