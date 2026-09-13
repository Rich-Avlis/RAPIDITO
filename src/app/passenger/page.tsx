'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MapView } from '@/components/map/MapView'
import { PlaceSelector } from '@/components/map/PlaceSelector'

interface Driver {
  id: string
  firstName: string
  lastName: string
  rating: number
  completedTrips: number
  vehicle?: {
    brand: string
    model: string
    color: string
    plateNumber: string
    type?: string
  }
  distance: number
  eta: number
}

interface SelectedPlace {
  name: string
  lat: number
  lng: number
}

type PanelView = 'home' | 'search' | 'vehicles' | 'ride'

export default function PassengerDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [panelView, setPanelView] = useState<PanelView>('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([])
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationName, setLocationName] = useState('')

  const [origin, setOrigin] = useState<SelectedPlace | null>(null)
  const [destination, setDestination] = useState<SelectedPlace | null>(null)
  const [selectingField, setSelectingField] = useState<'origin' | 'destination' | null>(null)

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [rideEstimate, setRideEstimate] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [customPrice, setCustomPrice] = useState<number>(0)

  // Recent locations
  const [recentLocations] = useState<SelectedPlace[]>([
    { name: 'Plaza Bolívar, Quíbor', lat: 9.3167, lng: -70.6045 },
    { name: 'Sambil Barquisimeto', lat: 10.0647, lng: -69.3570 },
  ])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setCurrentLocation(loc)
          setOrigin({ name: 'Ubicación actual', lat: loc.lat, lng: loc.lng })

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json&accept-language=es`
            )
            const data = await res.json()
            const name = data.display_name?.split(',').slice(0, 2).join(',') || 'Ubicación actual'
            setLocationName(name)
            setOrigin({ name, lat: loc.lat, lng: loc.lng })
          } catch {
            setLocationName('Ubicación actual')
          }
        },
        (error) => {
          console.error('Location error:', error)
        }
      )
    }
  }, [])

  useEffect(() => {
    if (currentLocation) {
      searchNearbyDrivers()
    }
  }, [currentLocation])

  const searchNearbyDrivers = async () => {
    if (!currentLocation) return
    try {
      const response = await fetch(
        `/api/drivers/nearby?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=5`
      )
      const data = await response.json()
      if (data.success) {
        setNearbyDrivers(data.data.drivers)
      }
    } catch (error) {
      console.error('Error searching drivers:', error)
    }
  }

  const handleMapClick = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`
      )
      const data = await res.json()
      const name = data.display_name?.split(',').slice(0, 2).join(',') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`

      if (selectingField === 'origin') {
        setOrigin({ name, lat, lng })
        setSelectingField(null)
      } else if (selectingField === 'destination') {
        setDestination({ name, lat, lng })
        setSelectingField(null)
        setPanelView('vehicles')
      }
    } catch {
      const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      if (selectingField === 'origin') {
        setOrigin({ name: fallback, lat, lng })
        setSelectingField(null)
      } else if (selectingField === 'destination') {
        setDestination({ name: fallback, lat, lng })
        setSelectingField(null)
        setPanelView('vehicles')
      }
    }
  }

  const handleRequestRide = async (vehicleType: string) => {
    if (!origin || !destination) return

    setIsSearching(true)
    setSelectedVehicle(vehicleType)

    try {
      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originAddress: origin.name,
          originLat: origin.lat,
          originLng: origin.lng,
          destAddress: destination.name,
          destLat: destination.lat,
          destLng: destination.lng,
          estimatedFare: rideEstimate?.estimatedFare || 1.0,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setRideEstimate(data.data.fare)
        setCustomPrice(data.data.fare.estimatedFare)
      }
    } catch (error) {
      console.error('Error requesting ride:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const vehicleTypes = [
    { id: 'moto', name: 'Moto', capacity: 1, icon: '🏍️', priceMultiplier: 1.0 },
    { id: 'car', name: 'Económico', capacity: 3, icon: '🚗', priceMultiplier: 1.6 },
    { id: 'comfort', name: 'Confort', capacity: 4, icon: '🚙', priceMultiplier: 2.1 },
  ]

  const mapMarkers = [
    ...(origin ? [{
      id: 'origin',
      position: [origin.lat, origin.lng] as [number, number],
      type: 'pickup' as const,
      label: `Origen: ${origin.name}`,
    }] : []),
    ...(destination ? [{
      id: 'destination',
      position: [destination.lat, destination.lng] as [number, number],
      type: 'destination' as const,
      label: `Destino: ${destination.name}`,
    }] : []),
    ...nearbyDrivers.map(driver => ({
      id: driver.id,
      position: [
        currentLocation?.lat + (Math.random() - 0.5) * 0.02,
        currentLocation?.lng + (Math.random() - 0.5) * 0.02,
      ] as [number, number],
      type: 'driver' as const,
      label: `${driver.firstName} ${driver.vehicle?.brand || ''} - ${driver.distance.toFixed(1)} km`,
    })),
  ]

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-100">Cargando...</div>
  }

  return (
    <div className="fixed inset-0 bg-gray-100">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute left-0 top-0 h-full w-80 bg-[#1a1f36] text-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-white">RAPIDITO</h1>
                <button onClick={() => setSidebarOpen(false)} className="text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold">{user.firstName} {user.lastName}</p>
                  <button className="text-xs bg-primary px-3 py-1 rounded-full text-white font-medium">
                    Editar perfil
                  </button>
                </div>
              </div>

              <nav className="space-y-1">
                {[
                  { icon: '🕐', label: 'Historial' },
                  { icon: '💰', label: 'Billetera', extra: '($0)' },
                  { icon: '🎧', label: 'Soporte Técnico' },
                  { icon: '👥', label: 'Referidos' },
                  { icon: '❤️', label: 'Conductores favoritos' },
                  { icon: '🎨', label: 'Estilo y tema' },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="flex items-center gap-4 w-full px-4 py-3 text-left text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label} {item.extra || ''}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-8 pt-8 border-t border-white/20">
                <button
                  onClick={logout}
                  className="flex items-center gap-4 w-full px-4 py-3 text-left text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <span className="text-xl">🚪</span>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map (full screen) */}
      <div className="absolute inset-0">
        <MapView
          center={currentLocation ? [currentLocation.lat, currentLocation.lng] : undefined}
          markers={mapMarkers}
          className="h-full"
          onLocationSelect={selectingField ? handleMapClick : undefined}
        />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-50"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {panelView === 'home' && origin && (
            <div className="bg-white rounded-xl px-4 py-2 shadow-lg flex-1">
              <p className="text-sm text-gray-500">📍 {origin.name}</p>
            </div>
          )}

          {panelView !== 'home' && (
            <div className="bg-white rounded-xl shadow-lg flex-1 overflow-hidden">
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-black" />
                  <p className="text-sm truncate flex-1">{origin?.name || 'Origen'}</p>
                  <button onClick={() => { setOrigin(null); setPanelView('search') }} className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <p className="text-sm truncate flex-1 text-gray-400">
                    {destination?.name || 'Ingrese el destino'}
                  </p>
                  <button onClick={() => { setDestination(null); setPanelView('search') }} className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <button
                onClick={() => setPanelView('home')}
                className="w-full bg-[#1a1f36] text-white py-2 text-sm font-medium"
              >
                Toca para cambiar la dirección
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Security Banner */}
      {panelView === 'home' && (
        <div className="absolute bottom-48 left-4 right-4 z-10">
          <div className="bg-white rounded-xl p-3 shadow-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
              ✓
            </div>
            <p className="text-sm text-gray-700">¡Bienvenido! Tu seguridad es nuestra prioridad</p>
          </div>
        </div>
      )}

      {/* Compass Button */}
      <div className="absolute right-4 bottom-40 z-10">
        <button className="bg-white rounded-full p-3 shadow-lg">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9l5-5 5 5" />
          </svg>
        </button>
      </div>

      {/* Bottom Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        {panelView === 'home' && (
          <div className="bg-white rounded-t-3xl shadow-2xl">
            <div className="p-4">
              <button
                onClick={() => setPanelView('search')}
                className="w-full bg-gray-100 rounded-xl px-4 py-4 flex items-center gap-3 text-left"
              >
                <div className="w-3 h-3 rounded-full bg-black" />
                <span className="text-gray-500">Toca aquí para comenzar</span>
              </button>
            </div>

            {/* Referral Banner */}
            <div className="px-4 pb-4">
              <div className="bg-primary rounded-xl p-4 flex items-center gap-4">
                <div className="text-4xl">🎉</div>
                <div>
                  <p className="font-bold text-white">¡Comparte y gana!</p>
                  <p className="text-sm text-white/80">Refiere a tus amigos y gana sin límites</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {panelView === 'search' && (
          <div className="bg-white rounded-t-3xl shadow-2xl">
            <div className="p-4 space-y-3">
              {/* Origin */}
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-black" />
                <input
                  type="text"
                  value={origin?.name || ''}
                  onChange={(e) => setOrigin(prev => prev ? { ...prev, name: e.target.value } : null)}
                  onFocus={() => setSelectingField('origin')}
                  placeholder="Origen"
                  className="flex-1 text-sm border-b pb-2 outline-none"
                />
              </div>

              {/* Destination */}
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <input
                  type="text"
                  value={destination?.name || ''}
                  onChange={(e) => setDestination(prev => prev ? { ...prev, name: e.target.value } : null)}
                  onFocus={() => setSelectingField('destination')}
                  placeholder="Ingrese el destino"
                  className="flex-1 text-sm border-b pb-2 outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button className="flex-1 border border-gray-300 rounded-xl py-2 px-4 flex items-center justify-center gap-2 text-sm">
                  <span>⭐</span> Agrega lugar favorito
                </button>
                <select className="bg-[#1a1f36] text-white rounded-xl py-2 px-4 text-sm">
                  <option>Solo ida</option>
                  <option>Ida y vuelta</option>
                </select>
              </div>

              {/* Map Selection Button */}
              <button
                onClick={() => setSelectingField('destination')}
                className="w-full bg-primary rounded-xl py-3 text-white font-medium flex items-center justify-center gap-2"
              >
                📍 Señalar la ubicación en el mapa
              </button>

              {/* Recent Locations */}
              <div className="space-y-2 pt-2">
                {recentLocations.map((loc, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDestination(loc)
                      setPanelView('vehicles')
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
                  >
                    <span className="text-gray-400">🕐</span>
                    <div>
                      <p className="text-sm font-medium">{loc.name.split(',')[0]}</p>
                      <p className="text-xs text-gray-500 truncate">{loc.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Buttons */}
            <div className="p-4 flex gap-3 border-t">
              <button
                onClick={() => setPanelView('home')}
                className="flex-1 border border-gray-300 rounded-xl py-3 font-medium"
              >
                Volver
              </button>
              <button
                onClick={() => {
                  if (destination) setPanelView('vehicles')
                }}
                className="flex-1 bg-[#1a1f36] text-white rounded-xl py-3 font-medium"
              >
                Confirmar viaje
              </button>
            </div>
          </div>
        )}

        {panelView === 'vehicles' && (
          <div className="bg-white rounded-t-3xl shadow-2xl">
            {/* Promo Code */}
            <div className="p-4">
              <button className="bg-[#1a1f36] text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2">
                🎫 Agregar código
              </button>
            </div>

            {/* Vehicle Options */}
            <div className="px-4 pb-4 flex gap-3 overflow-x-auto">
              {vehicleTypes.map((vehicle) => {
                const price = (rideEstimate?.estimatedFare || 1.0) * vehicle.priceMultiplier
                const discountedPrice = price * 0.95

                return (
                  <button
                    key={vehicle.id}
                    onClick={() => {
                      setSelectedVehicle(vehicle.id)
                      setRideEstimate({ ...rideEstimate, selectedVehicle: vehicle, estimatedFare: discountedPrice })
                      setCustomPrice(discountedPrice)
                    }}
                    className={`min-w-[140px] bg-gray-50 rounded-xl p-4 text-left border-2 transition-all ${
                      selectedVehicle === vehicle.id ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">-5%</span>
                    </div>
                    <p className="font-bold">{vehicle.name}</p>
                    <p className="text-xs text-gray-500">👤 {vehicle.capacity}</p>
                    <div className="mt-3 text-2xl">{vehicle.icon}</div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-400 line-through">${price.toFixed(2)}</p>
                      <p className="font-bold text-primary">${discountedPrice.toFixed(2)}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Bottom Buttons */}
            <div className="p-4 flex gap-3 border-t">
              <button
                onClick={() => setPanelView('search')}
                className="flex-1 border border-gray-300 rounded-xl py-3 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (selectedVehicle) {
                    setPanelView('ride')
                  }
                }}
                className="flex-1 bg-[#1a1f36] text-white rounded-xl py-3 font-medium"
                disabled={!selectedVehicle}
              >
                Confirmar viaje
              </button>
            </div>
          </div>
        )}

        {panelView === 'ride' && rideEstimate && (
          <div className="bg-white rounded-t-3xl shadow-2xl">
            {/* Discount Banner */}
            <div className="bg-blue-500 text-white p-3 flex items-center justify-between">
              <span className="font-medium">5% Descuento aplicado</span>
              <div className="flex items-center gap-2">
                <span className="line-through text-white/70">${(rideEstimate.estimatedFare / 0.95).toFixed(2)}</span>
                <span className="font-bold">${rideEstimate.estimatedFare.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-4">
              {/* Vehicle Info */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xl font-bold">{vehicleTypes.find(v => v.id === selectedVehicle)?.name}</p>
                  <p className="text-sm text-gray-500">Capacidad Máxima</p>
                  <p className="text-sm">👤 {vehicleTypes.find(v => v.id === selectedVehicle)?.capacity}</p>
                </div>
                <div className="text-5xl">{vehicleTypes.find(v => v.id === selectedVehicle)?.icon}</div>
              </div>

              {/* Price Selection */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <span className="bg-primary text-white px-4 py-2 rounded-xl font-medium">
                    Tarifa Recomendada
                  </span>
                  <span className="text-xl font-bold">${customPrice.toFixed(2)}</span>
                </div>

                <p className="text-center text-sm text-gray-500 mb-3">Seleccione el monto a pagar</p>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setCustomPrice(prev => Math.max(prev - 0.19, 0.50))}
                    className="bg-primary text-white px-4 py-2 rounded-xl font-bold"
                  >
                    -$0.19
                  </button>
                  <span className="text-lg font-bold px-4">{customPrice.toFixed(2)} $</span>
                  <button
                    onClick={() => setCustomPrice(prev => prev + 0.19)}
                    className="bg-primary text-white px-4 py-2 rounded-xl font-bold"
                  >
                    +$0.19
                  </button>
                </div>
              </div>

              {/* Start Ride Button */}
              <button className="w-full bg-[#1a1f36] text-white rounded-xl py-4 font-bold mt-4 text-lg">
                Comenzar viaje
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}