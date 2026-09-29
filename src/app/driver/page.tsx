'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FluidOrb from '@/components/ui/fluid-orb'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
const MapView = dynamic(() => import('@/components/map/MapView').then(m => m.MapView), { ssr: false })

interface RideRequest {
  id: string
  passenger: {
    tripCount: number
    user: { firstName: string; lastName: string; phone: string }
  }
  originAddress: string
  destAddress: string
  estimatedFare: number
  riderName?: string | null
  riderPhone?: string | null
  vehicleType?: string
}

const VEHICLE_LABELS: Record<string, { icon: string; name: string }> = {
  moto: { icon: '🏍️', name: 'Moto' },
  car: { icon: '🚗', name: 'Carrito' },
  chill: { icon: '🚙', name: 'Carrito Chill' },
  pets: { icon: '🐕', name: 'Mascotas' },
}

export default function DriverDashboard() {
  const { user, logout } = useAuth()
  const [isOnline, setIsOnline] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [bsRate, setBsRate] = useState<number | null>(null)
  const [todayStats, setTodayStats] = useState({
    earnings: 0,
    trips: 0,
    rating: user?.driverProfile?.rating || 5.0,
  })
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([])
  const [activeRide, setActiveRide] = useState<any>(null)
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [isUpdatingRide, setIsUpdatingRide] = useState(false)

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
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }, [isOnline])

  // Poll solicitudes abiertas cuando está en línea
  useEffect(() => {
    if (!isOnline) return
    const load = async () => {
      try {
        const res = await fetch('/api/rides?status=SEARCHING_DRIVER&limit=10')
        const data = await res.json()
        if (data.success) setRideRequests(data.data.rides)
      } catch {}
    }
    load()
    const iv = setInterval(load, 10000)
    return () => clearInterval(iv)
  }, [isOnline])

  // Recuperar viaje activo (al recargar o si otro cliente lo aceptó)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/rides?limit=20')
        const data = await res.json()
        if (!data.success) return
        const rides = data.data.rides
        const active = rides.find((r: { status: string }) =>
          ['DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'TRIP_STARTED'].includes(r.status)
        )
        setActiveRide((prev: { status: string } | null) => {
          if (active) return active
          if (prev && ['COMPLETED', 'CANCELLED'].includes(prev.status)) return prev
          return null
        })
      } catch {}
    }
    load()
    const iv = setInterval(load, 8000)
    return () => clearInterval(iv)
  }, [user?.id])

  // Tasa BCV USD→Bs
  useEffect(() => {
    fetch('/api/rates')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.usdToBs) setBsRate(data.data.usdToBs)
      })
      .catch(() => {})
  }, [])

  const fmtBs = (usd: number) => {
    if (!bsRate) return null
    return `${Math.round(usd * bsRate).toLocaleString('es-VE')} Bs`
  }

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

  const updateRideStatus = async (rideId: string, action: string): Promise<boolean> => {
    if (isUpdatingRide) return false
    setIsUpdatingRide(true)
    try {
      const res = await fetch(`/api/rides/${rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (data.success) {
        setActiveRide(data.data.ride)
        if (action === 'complete') {
          const fare = data.data.ride.finalFare ?? data.data.ride.estimatedFare
          setTodayStats(prev => ({
            ...prev,
            earnings: prev.earnings + fare,
            trips: prev.trips + 1,
          }))
        }
        return true
      }
      alert(data.error || 'Error al actualizar el viaje')
      return false
    } catch {
      alert('Error de conexión')
      return false
    } finally {
      setIsUpdatingRide(false)
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
            <Image src="/logo-r.png" alt="RAPIDITO" width={47} height={32} className="h-8 w-auto" />
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
            <Card className="relative overflow-hidden border-0">
              {isOnline && (
                <div className="absolute -top-8 -right-8 opacity-30 pointer-events-none">
                  <FluidOrb size={120} color="#22C55E" />
                </div>
              )}
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
            <Card className="border-0">
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
            <Card className="border-0">
              <CardContent className="p-4 space-y-2">
                <Link href="/driver/profile">
                  <Button variant="outline" className="w-full justify-start border-0 bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/25 hover:bg-[#E55D00]">
                    👤 Mi Perfil y Moto
                  </Button>
                </Link>
                <Link href="/driver/documents">
                  <Button variant="outline" className="w-full justify-start border-0 bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/25 hover:bg-[#E55D00]">
                    📄 Mi Documentación
                  </Button>
                </Link>
                <Link href="/driver/wallet">
                  <Button variant="outline" className="w-full justify-start border-0 bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/25 hover:bg-[#E55D00]">
                    💰 Mi Cartera
                  </Button>
                </Link>
                <Link href="/driver/history">
                  <Button variant="outline" className="w-full justify-start border-0 bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/25 hover:bg-[#E55D00]">
                    📊 Historial
                  </Button>
                </Link>
                <Link href="/driver/faq">
                  <Button variant="outline" className="w-full justify-start border-0 bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/25 hover:bg-[#E55D00]">
                    📚 Tutorial y Ayuda
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

            {/* Active Trip */}
            {activeRide && (
              <div className="mt-6">
                <Card className="border-primary">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-900">Viaje activo</h2>
                      <span className={`text-sm font-semibold ${
                        activeRide.status === 'TRIP_STARTED' ? 'text-green-600' :
                        activeRide.status === 'COMPLETED' ? 'text-primary' :
                        activeRide.status === 'CANCELLED' ? 'text-red-500' : 'text-blue-600'
                      }`}>
                        {activeRide.status === 'DRIVER_ASSIGNED' && '🟠 Yendo al punto de recogida'}
                        {activeRide.status === 'DRIVER_ARRIVED' && '🟡 Esperando en el punto'}
                        {activeRide.status === 'TRIP_STARTED' && '🟢 Viaje en curso'}
                        {activeRide.status === 'COMPLETED' && '✅ Completado'}
                        {activeRide.status === 'CANCELLED' && '❌ Cancelado'}
                      </span>
                    </div>

                    <div className="text-sm space-y-1">
                      <p className="font-semibold text-gray-900">
                        👤 {activeRide.riderName || `${activeRide.passenger?.user?.firstName} ${activeRide.passenger?.user?.lastName}`}
                      </p>
                      {(activeRide.riderPhone || activeRide.passenger?.user?.phone) && (
                        <p className="text-gray-500">📱 {activeRide.riderPhone || activeRide.passenger?.user?.phone}</p>
                      )}
                      <p>📍 {activeRide.originAddress}</p>
                      <p>🏁 {activeRide.destAddress}</p>
                      <p className="text-lg font-bold text-primary">
                        💰 ${(activeRide.finalFare ?? activeRide.estimatedFare).toFixed(2)}
                        {fmtBs(activeRide.finalFare ?? activeRide.estimatedFare) && (
                          <span className="ml-2 text-sm font-normal text-gray-500">≈ {fmtBs(activeRide.finalFare ?? activeRide.estimatedFare)}</span>
                        )}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {activeRide.status === 'DRIVER_ASSIGNED' && (
                        <Button size="sm" variant="success" disabled={isUpdatingRide} onClick={() => updateRideStatus(activeRide.id, 'arrive')}>
                          📍 Llegué al punto
                        </Button>
                      )}
                      {activeRide.status === 'DRIVER_ARRIVED' && (
                        <Button size="sm" variant="success" disabled={isUpdatingRide} onClick={() => updateRideStatus(activeRide.id, 'start')}>
                          ▶️ Iniciar viaje
                        </Button>
                      )}
                      {activeRide.status === 'TRIP_STARTED' && (
                        <Button size="sm" variant="success" disabled={isUpdatingRide} onClick={() => updateRideStatus(activeRide.id, 'complete')}>
                          🏁 Finalizar viaje
                        </Button>
                      )}
                      {(activeRide.status === 'COMPLETED' || activeRide.status === 'CANCELLED') && (
                        <Button size="sm" variant="outline" onClick={() => setActiveRide(null)}>
                          Cerrar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Ride Requests */}
            {isOnline && !activeRide && (
              <div className="mt-6">
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  Solicitudes cercanas ({rideRequests.filter((r) => !dismissedIds.includes(r.id)).length})
                </h2>
                <div className="space-y-4">
                  {rideRequests.filter((r) => !dismissedIds.includes(r.id)).map((request) => {
                    const vehicle = VEHICLE_LABELS[request.vehicleType || 'moto']
                    return (
                    <Card key={request.id} className="border-primary">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              👤 {request.passenger.user.firstName} {request.passenger.user.lastName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              🛵 {vehicle?.icon} {vehicle?.name} • {request.passenger.tripCount} viajes
                            </p>
                            {request.riderName && (
                              <p className="text-sm font-semibold text-blue-600">
                                👥 Para: {request.riderName}{request.riderPhone ? ` (${request.riderPhone})` : ''}
                              </p>
                            )}
                            <div className="mt-2 space-y-1 text-sm">
                              <p>📍 {request.originAddress}</p>
                              <p>📍 {request.destAddress}</p>
                            </div>
                            <p className="mt-2 text-lg font-bold text-primary">
                              💰 ${request.estimatedFare.toFixed(2)}
                              {fmtBs(request.estimatedFare) && (
                                <span className="ml-2 text-sm font-normal text-gray-500">≈ {fmtBs(request.estimatedFare)}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="success" disabled={isUpdatingRide} onClick={() => updateRideStatus(request.id, 'accept')}>
                              Aceptar
                            </Button>
                            <Button size="sm" variant="outline">
                              Contraofertar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => setDismissedIds(prev => [...prev, request.id])}>
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    )
                  })}

                  {rideRequests.filter((r) => !dismissedIds.includes(r.id)).length === 0 && (
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
