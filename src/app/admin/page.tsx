'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapView } from '@/components/map/MapView'

interface AdminStats {
  totalUsers: number
  totalPassengers: number
  totalDrivers: number
  onlineDrivers: number
  busyDrivers: number
  totalRides: number
  activeRides: number
  completedRides: number
  cancelledRides: number
  totalRevenue: number
  totalCommissions: number
  pendingWithdrawals: number
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentRides, setRecentRides] = useState<any[]>([])
  const [onlineDrivers, setOnlineDrivers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data.stats)
        setRecentRides(data.data.recentRides)
        setOnlineDrivers(data.data.onlineDrivers)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
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
            <span className="font-bold text-gray-900">RAPIDITO Admin</span>
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
        <h1 className="mb-8 text-2xl font-bold text-gray-900">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Usuarios Totales</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.totalUsers || 0}
                  </p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Conductores Online</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats?.onlineDrivers || 0}
                  </p>
                </div>
                <div className="text-4xl">🟢</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Viajes Activos</p>
                  <p className="text-3xl font-bold text-primary">
                    {stats?.activeRides || 0}
                  </p>
                </div>
                <div className="text-4xl">🚗</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ingresos Totales</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${(stats?.totalRevenue || 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Comisiones</p>
                  <p className="text-3xl font-bold text-primary">
                    ${(stats?.totalCommissions || 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Viajes Completados</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.completedRides || 0}
                  </p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Viajes Cancelados</p>
                  <p className="text-3xl font-bold text-red-500">
                    {stats?.cancelledRides || 0}
                  </p>
                </div>
                <div className="text-4xl">❌</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Retiros Pendientes</p>
                  <p className="text-3xl font-bold text-yellow-500">
                    {stats?.pendingWithdrawals || 0}
                  </p>
                </div>
                <div className="text-4xl">⏳</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Admin Map */}
          <Card>
            <CardHeader>
              <CardTitle>Mapa en Tiempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] rounded-lg overflow-hidden">
                <MapView
                  center={[9.3167, -70.6045]} // Quíbor
                  zoom={13}
                  markers={onlineDrivers.map((driver: any) => ({
                    id: driver.id,
                    position: [
                      driver.driverProfile?.currentLat || 9.3167,
                      driver.driverProfile?.currentLng || -70.6045,
                    ] as [number, number],
                    type: 'driver' as const,
                    label: `${driver.firstName} - ${driver.driverProfile?.isOnline ? 'En línea' : 'Desconectado'}`,
                  }))}
                  className="h-full"
                />
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-green-500"></span>
                  Disponible
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
                  Ocupado
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-gray-500"></span>
                  Desconectado
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Rides */}
          <Card>
            <CardHeader>
              <CardTitle>Viajes Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRides.slice(0, 5).map((ride) => (
                  <div
                    key={ride.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {ride.passenger?.user?.firstName} →{' '}
                        {ride.driver?.user?.firstName || 'Sin conductor'}
                      </p>
                      <p className="text-sm text-gray-500">{ride.destAddress}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${(ride.finalFare || ride.estimatedFare).toFixed(2)}
                      </p>
                      <p
                        className={`text-xs ${
                          ride.status === 'COMPLETED'
                            ? 'text-green-600'
                            : ride.status === 'CANCELLED'
                            ? 'text-red-500'
                            : 'text-yellow-500'
                        }`}
                      >
                        {ride.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Online Drivers */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Conductores en Línea ({onlineDrivers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {onlineDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold">
                    {driver.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{driver.name}</p>
                    <p className="text-sm text-gray-500">{driver.vehicle}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
