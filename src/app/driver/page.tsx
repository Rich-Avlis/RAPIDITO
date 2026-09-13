'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import dynamic from 'next/dynamic'
import Link from 'next/link'
const MapView = dynamic(() => import('@/components/map/MapView').then(m => m.MapView), { ssr: false })

interface RideRequest {
  id: string
  passenger: {
    firstName: string
    lastName: string
    rating: number
    tripCount: number
  }
  originAddress: string
  destAddress: string
  estimatedFare: number
  distance: number
}

export default function DriverDashboard() {
  const { user, logout } = useAuth()
  const [isOnline, setIsOnline] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [todayStats, setTodayStats] = useState({
    earnings: 0,
    trips: 0,
    rating: user?.driverProfile?.rating || 5.0,
  })
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([])
  const [activeRide, setActiveRide] = useState<any>(null)

  useEffect(() => {
    // Get driver's current location
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setCurrentLocation(newLocation)
          
          // Update location on server if online
          if (isOnline) {
            updateLocation(newLocation)
          }
        },
        (error) => {
          console.error('Location error:', error)
        },
        { enableHighAccuracy: true }
      )
    }
  }, [isOnline])

  const updateLocation = async (location: { lat: number; lng: number }) => {
    try {
      await fetch('/api/drivers/location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
        }),
      })
    } catch (error) {
      console.error('Error updating location:', error)
    }
  }

  const toggleOnlineStatus = async () => {
    if (!isOnline && !currentLocation) {
      alert('Para recibir viajes necesitas activar tu ubicación.')
      return
    }

    try {
      const response = await fetch('/api/drivers/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isOnline: !isOnline,
          lat: currentLocation?.lat,
          lng: currentLocation?.lng,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setIsOnline(!isOnline)
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Error toggling status:', error)
    }
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
              R
            </div>
            <span className="font-bold text-gray-900">RAPIDITO</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.firstName} {user.lastName}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Status Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Online Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  {isOnline ? (
                    <span className="text-green-600">🟢 ESTÁS EN LÍNEA</span>
                  ) : (
                    <span className="text-red-500">🔴 DESCONECTADO</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  size="xl"
                  variant={isOnline ? 'destructive' : 'success'}
                  onClick={toggleOnlineStatus}
                >
                  {isOnline ? 'DESCONECTARSE' : 'PONERME EN LÍNEA'}
                </Button>
                {isOnline && (
                  <p className="mt-4 text-center text-sm text-gray-500">
                    Buscando solicitudes cercanas...
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Today's Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Ganancias de hoy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">
                    ${todayStats.earnings.toFixed(2)}
                  </p>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{todayStats.trips}</p>
                    <p className="text-xs text-gray-500">Viajes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      ⭐ {todayStats.rating.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">Calificación</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <Link href="/driver/documents">
                  <Button variant="outline" className="w-full justify-start">
                    📄 Mi Documentación
                  </Button>
                </Link>
                <Link href="/driver/wallet">
                  <Button variant="outline" className="w-full justify-start">
                    💰 Mi Cartera
                  </Button>
                </Link>
                <Link href="/driver/history">
                  <Button variant="outline" className="w-full justify-start">
                    📊 Historial
                  </Button>
                </Link>
                <Link href="/driver/complete-profile">
                  <Button variant="outline" className="w-full justify-start">
                    ⚙️ Mi Perfil
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Map Area */}
          <div className="lg:col-span-2">
            <Card className="h-[500px] lg:h-[600px] overflow-hidden">
              <MapView
                center={currentLocation ? [currentLocation.lat, currentLocation.lng] : undefined}
                markers={currentLocation ? [{
                  id: 'driver',
                  position: [currentLocation.lat, currentLocation.lng],
                  type: 'driver',
                  label: `${user.firstName} - ${isOnline ? 'En línea' : 'Desconectado'}`,
                }] : []}
                className="h-full"
              />
            </Card>

            {/* Ride Requests */}
            {isOnline && (
              <div className="mt-6">
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  Solicitudes cercanas ({rideRequests.length})
                </h2>
                <div className="space-y-4">
                  {rideRequests.map((request) => (
                    <Card key={request.id} className="border-primary">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              👤 {request.passenger.firstName} {request.passenger.lastName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              ⭐ {request.passenger.rating} • {request.passenger.tripCount} viajes
                            </p>
                            <div className="mt-2 space-y-1 text-sm">
                              <p>📍 {request.originAddress}</p>
                              <p>📍 {request.destAddress}</p>
                            </div>
                            <p className="mt-2 text-lg font-bold text-primary">
                              💰 ${request.estimatedFare.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="success">
                              Aceptar
                            </Button>
                            <Button size="sm" variant="outline">
                              Contraofertar
                            </Button>
                            <Button size="sm" variant="destructive">
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {rideRequests.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                      <p>Esperando solicitudes...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
