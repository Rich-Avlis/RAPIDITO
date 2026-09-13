import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return unauthorizedResponse('Admin access required')
    }

    // Get all stats in parallel
    const [
      totalUsers,
      totalPassengers,
      totalDrivers,
      onlineDrivers,
      busyDrivers,
      totalRides,
      activeRides,
      completedRides,
      cancelledRides,
      totalRevenue,
      totalCommissions,
      pendingWithdrawals,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.passengerProfile.count(),
      prisma.driverProfile.count(),
      prisma.driverProfile.count({ where: { isOnline: 'ONLINE' } }),
      prisma.driverProfile.count({ where: { isOnline: 'BUSY' } }),
      prisma.ride.count(),
      prisma.ride.count({
        where: {
          status: { in: ['REQUESTED', 'SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'TRIP_STARTED'] },
        },
      }),
      prisma.ride.count({ where: { status: 'COMPLETED' } }),
      prisma.ride.count({ where: { status: 'CANCELLED' } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'VERIFIED' } }),
      prisma.payment.aggregate({ _sum: { commission: true }, where: { status: 'VERIFIED' } }),
      prisma.withdrawal.count({ where: { status: 'PENDING' } }),
    ])

    // Get recent rides
    const recentRides = await prisma.ride.findMany({
      take: 10,
      orderBy: { requestedAt: 'desc' },
      include: {
        passenger: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        driver: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    })

    // Get online drivers with location
    const onlineDriversList = await prisma.driverProfile.findMany({
      where: {
        isOnline: 'ONLINE',
        currentLat: { not: null },
        currentLng: { not: null },
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        vehicle: true,
      },
    })

    return successResponse({
      stats: {
        totalUsers,
        totalPassengers,
        totalDrivers,
        onlineDrivers,
        busyDrivers,
        totalRides,
        activeRides,
        completedRides,
        cancelledRides,
        totalRevenue: totalRevenue._sum.amount || 0,
        totalCommissions: totalCommissions._sum.commission || 0,
        pendingWithdrawals,
      },
      recentRides,
      onlineDrivers: onlineDriversList.map(d => ({
        id: d.id,
        name: `${d.user.firstName} ${d.user.lastName}`,
        lat: d.currentLat,
        lng: d.currentLng,
        vehicle: d.vehicle
          ? `${d.vehicle.brand} ${d.vehicle.model}`
          : 'No vehicle',
        status: d.isOnline,
      })),
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return errorResponse('Internal server error', 500)
  }
}
