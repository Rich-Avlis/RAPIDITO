import { NextRequest, NextResponse } from 'next/server'
import { calculateFare, calculateDistance, calculateEta } from '@/services/fare'

export async function POST(request: NextRequest) {
  try {
    const { originLat, originLng, destLat, destLng, originAddress, destAddress, vehicleType } = await request.json()

    if (!originLat || !originLng || !destLat || !destLng) {
      return NextResponse.json({ success: false, error: 'Coordenadas requeridas' }, { status: 400 })
    }

    const distance = calculateDistance(originLat, originLng, destLat, destLng)
    const duration = calculateEta(distance)

    const fare = await calculateFare(
      { lat: originLat, lng: originLng },
      { lat: destLat, lng: destLng },
      distance,
      duration,
      originAddress || '',
      destAddress || '',
      vehicleType || 'moto'
    )

    return NextResponse.json({
      success: true,
      data: {
        distance: Math.round(distance * 100) / 100,
        duration,
        estimatedFare: fare.total,
        breakdown: fare,
      },
    })
  } catch (error) {
    console.error('Estimate error:', error)
    return NextResponse.json({ success: false, error: 'Error al calcular tarifa' }, { status: 500 })
  }
}
