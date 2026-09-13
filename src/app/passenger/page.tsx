'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/providers/auth-provider'
import dynamic from 'next/dynamic'
const MapView = dynamic(() => import('@/components/map/MapView').then(m => m.MapView), { ssr: false })

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

interface SearchSuggestion {
  name: string
  lat: number
  lng: number
}

type PanelView = 'home' | 'search' | 'vehicles' | 'vehicleDetail' | 'ride'

export default function PassengerDashboard() {
  const { user, logout } = useAuth()
  const [panelView, setPanelView] = useState<PanelView>('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([])
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number }>({ lat: 9.3167, lng: -70.6045 })
  const [locationName, setLocationName] = useState('Quíbor, Lara')

  const [origin, setOrigin] = useState<SelectedPlace>({ name: 'Quíbor, Lara', lat: 9.3167, lng: -70.6045 })
  const [destination, setDestination] = useState<SelectedPlace | null>(null)
  const [selectingField, setSelectingField] = useState<'origin' | 'destination' | null>(null)

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [rideEstimate, setRideEstimate] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [customPrice, setCustomPrice] = useState<number>(0)
  const [tripType, setTripType] = useState<'Solo ida' | 'Ida y vuelta' | 'Multi paradas'>('Solo ida')
  const [tripTypeOpen, setTripTypeOpen] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([])
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchSuggestion[]>([])
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('rapidito_search_history')
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved))
      } catch {}
    }
  }, [])

  // Save to search history
  const addToHistory = (place: SearchSuggestion) => {
    const newHistory = [place, ...searchHistory.filter(h => h.name !== place.name)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('rapidito_search_history', JSON.stringify(newHistory))
  }

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

  // Nominatim search for places
  const searchPlaces = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchSuggestions([])
      return
    }

    setIsSearchingPlaces(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Quíbor, Venezuela')}&format=json&limit=5&accept-language=es&addressdetails=1`
      )
      const data = await res.json()
      const suggestions: SearchSuggestion[] = data.map((item: any) => ({
        name: item.display_name?.split(',').slice(0, 3).join(',') || item.name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }))
      setSearchSuggestions(suggestions)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearchingPlaces(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(searchQuery)
    }, 500)
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, searchPlaces])

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    if (selectingField === 'origin') {
      setOrigin(suggestion)
    } else {
      setDestination(suggestion)
      addToHistory(suggestion)
    }
    setSearchQuery('')
    setSearchSuggestions([])
    setSelectingField(null)
    if (selectingField === 'destination') {
      setPanelView('vehicles')
    }
  }

  const handleSelectFromHistory = (place: SearchSuggestion) => {
    if (selectingField === 'origin') {
      setOrigin(place)
    } else {
      setDestination(place)
    }
    setSelectingField(null)
    if (selectingField === 'destination') {
      setPanelView('vehicles')
    }
  }

  const handleMapClick = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`
      )
      const data = await res.json()
      const name = data.display_name?.split(',').slice(0, 2).join(',') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`

      const place = { name, lat, lng }
      if (selectingField === 'origin') {
        setOrigin(place)
        setSelectingField(null)
      } else if (selectingField === 'destination') {
        setDestination(place)
        addToHistory(place)
        setSelectingField(null)
        setPanelView('vehicles')
      }
    } catch {
      const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      const place = { name: fallback, lat, lng }
      if (selectingField === 'origin') {
        setOrigin(place)
        setSelectingField(null)
      } else if (selectingField === 'destination') {
        setDestination(place)
        addToHistory(place)
        setSelectingField(null)
        setPanelView('vehicles')
      }
    }
  }

  const vehicleTypes = [
    { id: 'moto', name: 'Moto', capacity: 1, icon: '🏍️', priceMultiplier: 1.0, eta: '3 min', image: '🛵' },
    { id: 'car', name: 'Económico', capacity: 3, icon: '🚗', priceMultiplier: 1.6, eta: '5 min', image: '🚙' },
    { id: 'comfort', name: 'Confort', capacity: 4, icon: '🚙', priceMultiplier: 2.1, eta: '7 min', image: '🚘' },
  ]

  const mapMarkers = [
    ...(origin ? [{
      id: 'origin',
      position: [origin.lat, origin.lng] as [number, number],
      type: 'pickup' as const,
      label: `Partida: ${origin.name}`,
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
        (currentLocation?.lat ?? 0) + (Math.random() - 0.5) * 0.02,
        (currentLocation?.lng ?? 0) + (Math.random() - 0.5) * 0.02,
      ] as [number, number],
      type: 'driver' as const,
      label: `${driver.firstName} ${driver.vehicle?.brand || ''} - ${driver.distance.toFixed(1)} km`,
    })),
  ]

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-100">Cargando...</div>
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
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
                <h1 className="text-3xl font-bold text-white">RAPIDITO</h1>
                <button onClick={() => setSidebarOpen(false)} className="text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-between mb-8">
                <p className="text-lg">{user.firstName} {user.lastName}</p>
                <button className="bg-[#FF6B00] text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Editar perfil
                </button>
              </div>

              <nav className="space-y-2">
                {[
                  { icon: '🕐', label: 'Historial' },
                  { icon: '💰', label: 'Billetera ($0)' },
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
                    <span className="text-lg">{item.label}</span>
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

      {/* Top Bar */}
      <div className="relative z-20 bg-white shadow-sm">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="bg-gray-100 rounded-2xl p-3 hover:bg-gray-200 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 flex items-center gap-2">
            <div className="w-6 h-6 bg-[#FF6B00] rounded-full flex items-center justify-center">
              <span className="text-xs text-white">💎</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Plata</p>
              <p className="text-xs text-gray-500">0 km · 10d</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="relative flex-1 min-h-0">
        <MapView
          center={[currentLocation.lat, currentLocation.lng]}
          markers={mapMarkers}
          className="h-full w-full"
          onLocationSelect={selectingField ? handleMapClick : undefined}
        />

        {/* Security Banner - Overlay on map */}
        {panelView === 'home' && (
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="bg-white rounded-2xl p-4 shadow-lg flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <p className="text-sm text-gray-700 font-medium">¡Bienvenido! Tu seguridad es nuestra prioridad</p>
            </div>
          </div>
        )}

        {/* Compass Button - Overlay on map */}
        <div className="absolute right-4 bottom-4 z-10">
          <button className="bg-white rounded-full p-3 shadow-lg">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9l5-5 5 5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="relative z-20 bg-white rounded-t-[2rem] shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        {/* HOME VIEW */}
        {panelView === 'home' && (
          <div>
            <div className="p-5 space-y-4">
              {/* Where to? Search Bar */}
              <button
                onClick={() => {
                  setPanelView('search')
                  setSelectingField('destination')
                  setTimeout(() => searchInputRef.current?.focus(), 100)
                }}
                className="w-full bg-gray-100 rounded-2xl px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-200 transition-colors"
              >
                <div className="w-3 h-3 rounded-full bg-black" />
                <span className="text-gray-500 text-lg">¿A dónde vas?</span>
              </button>

              {/* Promo Banner */}
              <div className="bg-[#FF6B00] rounded-2xl p-4 flex items-center gap-4">
                <div className="text-5xl">🎉</div>
                <div>
                  <p className="font-bold text-white text-lg">¡Comparte y gana!</p>
                  <p className="text-sm text-white/80">Refiere a tus amigos y gana sin limites</p>
                </div>
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 pb-6">
              <div className="w-8 h-2 rounded-full bg-[#FF6B00]" />
              <div className="w-2 h-2 rounded-full bg-gray-300" />
            </div>
          </div>
        )}

        {/* SEARCH VIEW */}
        {panelView === 'search' && (
          <div>
            <div className="p-5 space-y-4">
              {/* Origin */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4">
                <div className="w-3 h-3 rounded-full bg-black" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">Origen</p>
                  <p className="text-sm font-medium text-gray-800">{origin?.name || 'Seleccionar origen'}</p>
                </div>
                <button 
                  onClick={() => setSelectingField('origin')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>

              {/* Destination Input */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#FF6B00]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSelectingField('destination')}
                    placeholder="¿A dónde vas?"
                    className="flex-1 text-base bg-transparent outline-none"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => {
                        setSearchQuery('')
                        setSearchSuggestions([])
                      }}
                      className="text-gray-400"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Loading indicator */}
                {isSearchingPlaces && (
                  <div className="mt-3 flex items-center gap-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Buscando lugares...</span>
                  </div>
                )}

                {/* Search Suggestions */}
                {searchSuggestions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white rounded-xl text-left transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#FF6B00]/10 flex items-center justify-center">
                          <svg className="w-4 h-4 text-[#FF6B00]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{suggestion.name.split(',')[0]}</p>
                          <p className="text-xs text-gray-500 truncate">{suggestion.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Map Selection Button */}
                <button
                  onClick={() => setSelectingField('destination')}
                  className="w-full mt-3 bg-[#FF6B00] rounded-2xl py-3 text-white font-bold text-sm flex items-center justify-center gap-2"
                >
                  📍 Señalar la ubicación en el mapa
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 border border-gray-300 rounded-2xl py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium">
                  <span>⭐</span> Lugar favorito
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setTripTypeOpen(!tripTypeOpen)}
                    className="bg-[#1a1f36] text-white rounded-2xl py-3 px-4 text-sm font-medium flex items-center gap-2"
                  >
                    {tripType}
                    <svg className={`w-4 h-4 transition-transform ${tripTypeOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {tripTypeOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-[#1a1f36] text-white rounded-2xl overflow-hidden shadow-xl z-20 w-48">
                      {['Solo ida', 'Ida y vuelta', 'Multi paradas'].map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setTripType(type as any)
                            setTripTypeOpen(false)
                          }}
                          className={`w-full px-4 py-3 text-left text-sm hover:bg-white/10 ${tripType === type ? 'bg-white/20' : ''}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Search History */}
              {searchHistory.length > 0 && !searchQuery && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Recientes</p>
                  {searchHistory.slice(0, 5).map((place, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectFromHistory(place)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl text-left transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-lg">🕐</span>
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-800">{place.name.split(',')[0]}</p>
                        <p className="text-sm text-gray-500 truncate">{place.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Buttons */}
            <div className="p-5 flex gap-4 border-t">
              <button
                onClick={() => {
                  setPanelView('home')
                  setSearchQuery('')
                  setSearchSuggestions([])
                  setSelectingField(null)
                }}
                className="flex-1 border-2 border-[#1a1f36] rounded-2xl py-4 font-bold text-[#1a1f36]"
              >
                Volver
              </button>
              <button
                onClick={() => {
                  if (destination) setPanelView('vehicles')
                }}
                className="flex-1 bg-[#1a1f36] text-white rounded-2xl py-4 font-bold"
                disabled={!destination}
              >
                Confirmar viaje
              </button>
            </div>
          </div>
        )}

        {/* VEHICLES VIEW */}
        {panelView === 'vehicles' && (
          <div>
            {/* Origin/Destination Bar */}
            <div className="p-4 border-b">
              <div className="bg-gray-100 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <div className="w-3 h-3 rounded-full bg-black" />
                  <p className="text-sm truncate flex-1">{origin?.name || 'Origen'}</p>
                </div>
                <div className="flex items-center gap-3 p-3 border-t">
                  <div className="w-3 h-3 rounded-full bg-[#FF6B00]" />
                  <p className="text-sm truncate flex-1 text-gray-500">{destination?.name || 'Destino'}</p>
                </div>
              </div>
              <button
                onClick={() => setPanelView('search')}
                className="w-full bg-[#1a1f36] text-white py-3 rounded-2xl text-sm font-bold mt-3"
              >
                Toca para cambiar la dirección
              </button>
            </div>

            {/* Promo Code */}
            <div className="p-4">
              <button className="bg-[#1a1f36] text-white rounded-2xl px-5 py-3 text-sm font-bold flex items-center gap-2">
                🎫 Agregar código
              </button>
            </div>

            {/* Vehicle Options */}
            <div className="px-4 pb-4 flex gap-4 overflow-x-auto">
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
                      setPanelView('vehicleDetail')
                    }}
                    className="min-w-[160px] bg-gray-50 rounded-2xl p-5 text-left border-2 border-transparent hover:border-[#FF6B00] transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs bg-[#FF6B00] text-white px-3 py-1 rounded-full font-bold">-5%</span>
                    </div>
                    <p className="font-bold text-lg">{vehicle.name}</p>
                    <p className="text-sm text-gray-500">👤 {vehicle.capacity}</p>
                    <div className="text-5xl my-4">{vehicle.image}</div>
                    <div>
                      <p className="text-sm text-gray-400 line-through">${price.toFixed(2)} –5%</p>
                      <p className="font-bold text-xl">${discountedPrice.toFixed(2)} ↑</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Bottom Buttons */}
            <div className="p-5 flex gap-4 border-t">
              <button
                onClick={() => setPanelView('search')}
                className="flex-1 border-2 border-[#1a1f36] rounded-2xl py-4 font-bold text-[#1a1f36]"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (selectedVehicle) setPanelView('vehicleDetail')
                }}
                className="flex-1 bg-[#1a1f36] text-white rounded-2xl py-4 font-bold"
                disabled={!selectedVehicle}
              >
                Confirmar viaje
              </button>
            </div>
          </div>
        )}

        {/* VEHICLE DETAIL VIEW */}
        {panelView === 'vehicleDetail' && selectedVehicle && (
          <div>
            <div className="p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{vehicleTypes.find(v => v.id === selectedVehicle)?.name}</h2>
                  <p className="text-gray-500">Capacidad Máxima</p>
                  <p className="text-lg">👤 {vehicleTypes.find(v => v.id === selectedVehicle)?.capacity}</p>
                  {selectedVehicle === 'moto' && (
                    <p className="text-sm text-gray-500 mt-2">Es necesario el uso del casco para este servicio</p>
                  )}
                </div>
                <div className="text-7xl">{vehicleTypes.find(v => v.id === selectedVehicle)?.image}</div>
              </div>

              {/* Service Options */}
              <div className="space-y-3 mt-6">
                {/* Servicio Rápido */}
                <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold">Servicio Rápido</p>
                    <p className="text-sm text-gray-500">Llegada más rápida</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-lg">${((rideEstimate?.estimatedFare || 1.0) * 1.1 * 0.95).toFixed(2)}</span>
                      <span className="text-sm text-gray-400 line-through">${((rideEstimate?.estimatedFare || 1.0) * 1.1).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <span>⚡</span> Más rápido
                    </span>
                    <span className="bg-[#FF6B00] text-white px-2 py-1 rounded-full text-xs font-bold">5%</span>
                    <button className="bg-[#1a1f36] text-white px-4 py-2 rounded-2xl text-sm font-bold">
                      Solicitar Rápido
                    </button>
                  </div>
                </div>

                {/* Servicio Normal */}
                <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold">Servicio Normal</p>
                    <p className="text-sm text-gray-500">Precio establecido</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-lg">${((rideEstimate?.estimatedFare || 1.0) * 0.95).toFixed(2)}</span>
                      <span className="text-sm text-gray-400 line-through">${(rideEstimate?.estimatedFare || 1.0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#FF6B00] text-white px-2 py-1 rounded-full text-xs font-bold">5%</span>
                    <button 
                      onClick={() => {
                        setCustomPrice((rideEstimate?.estimatedFare || 1.0) * 0.95)
                        setPanelView('ride')
                      }}
                      className="bg-[#1a1f36] text-white px-4 py-2 rounded-2xl text-sm font-bold"
                    >
                      Pedir Ahora
                    </button>
                  </div>
                </div>

                {/* Selecciona cuánto quieres pagar */}
                <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold">Selecciona cuánto quieres pagar</p>
                    <p className="text-sm text-gray-500">Elige tú el precio</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-lg">${((rideEstimate?.estimatedFare || 1.0) * 0.95).toFixed(2)}</span>
                      <span className="text-sm text-gray-400 line-through">${(rideEstimate?.estimatedFare || 1.0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#FF6B00] text-white px-2 py-1 rounded-full text-xs font-bold">5%</span>
                    <button 
                      onClick={() => setPanelView('ride')}
                      className="bg-[#1a1f36] text-white px-4 py-2 rounded-2xl text-sm font-bold"
                    >
                      Ofertar Ahora
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RIDE CONFIRMATION VIEW */}
        {panelView === 'ride' && rideEstimate && (
          <div>
            {/* Discount Banner */}
            <div className="bg-blue-500 text-white p-4 flex items-center justify-between">
              <span className="font-bold">5% Descuento aplicado</span>
              <div className="flex items-center gap-2">
                <span className="line-through text-white/70">${(customPrice / 0.95).toFixed(2)}</span>
                <span className="font-bold text-xl">${customPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-5">
              {/* Vehicle Info */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{vehicleTypes.find(v => v.id === selectedVehicle)?.name}</h2>
                  <p className="text-gray-500">Capacidad Máxima</p>
                  <p className="text-lg">👤 {vehicleTypes.find(v => v.id === selectedVehicle)?.capacity}</p>
                </div>
                <div className="text-7xl">{vehicleTypes.find(v => v.id === selectedVehicle)?.image}</div>
              </div>

              {/* Price Selection */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <span className="bg-white border border-gray-200 px-5 py-2 rounded-2xl font-bold text-lg">
                    Tarifa Recomendada
                  </span>
                  <span className="text-2xl font-bold">${customPrice.toFixed(2)}</span>
                </div>

                <p className="text-center text-sm text-gray-500 mb-4">Seleccione el monto a pagar</p>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setCustomPrice(prev => Math.max(prev - 0.19, 0.50))}
                    className="bg-[#FF6B00] text-white px-6 py-3 rounded-2xl font-bold text-lg"
                  >
                    –$0.19
                  </button>
                  <span className="text-xl font-bold px-4">{customPrice.toFixed(2)} $</span>
                  <button
                    onClick={() => setCustomPrice(prev => prev + 0.19)}
                    className="bg-[#FF6B00] text-white px-6 py-3 rounded-2xl font-bold text-lg"
                  >
                    +$0.19
                  </button>
                </div>
              </div>

              {/* Start Ride Button */}
              <button className="w-full bg-[#1a1f36] text-white rounded-2xl py-5 font-bold mt-6 text-xl">
                Comenzar viaje
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
