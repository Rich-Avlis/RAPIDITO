'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useTheme, themes } from '@/providers/theme-provider'
import FluidOrb from '@/components/ui/fluid-orb'
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
  const { theme, setTheme } = useTheme()
  const t = themes[theme]
  const [panelView, setPanelView] = useState<PanelView>('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
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

  // Referral & Discount state
  const [promoCode, setPromoCode] = useState('')
  const [promoModalOpen, setPromoModalOpen] = useState(false)
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number; ridesLeft: number } | null>(null)
  const [referralData, setReferralData] = useState<{ referralCode: string; referralsMade: number; ridesCompleted: number } | null>(null)
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  // Ride state
  const [isRequestingRide, setIsRequestingRide] = useState(false)
  const [activeRide, setActiveRide] = useState<any>(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [rating, setRating] = useState(5)
  const [ratingComment, setRatingComment] = useState('')

  // Wallet & Scheduled state
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [showScheduledModal, setShowScheduledModal] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [scheduledNotes, setScheduledNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [tipAmount, setTipAmount] = useState(0)
  const [showTipModal, setShowTipModal] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [showChatModal, setShowChatModal] = useState(false)

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('rapidito_search_history')
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved))
      } catch {}
    }
  }, [])

  // Load referral data
  useEffect(() => {
    const loadReferralData = async () => {
      try {
        const res = await fetch('/api/referral')
        const data = await res.json()
        if (data.success) {
          setReferralData(data.data)
          // Auto-apply first ride discount if eligible
          if (data.data.firstRideDiscountsAvailable > 0 && !appliedPromo) {
            setAppliedPromo({ code: 'FIRST_RIDE', discount: 5, ridesLeft: data.data.firstRideDiscountsAvailable })
          }
        }
      } catch {}
    }
    if (user) loadReferralData()
  }, [user])

  // Calculate discount
  const getDiscount = () => {
    if (appliedPromo) {
      return appliedPromo.discount
    }
    // Default: 5% for first 2 rides
    if (referralData && referralData.ridesCompleted < 2) {
      return 5
    }
    return 0
  }

  // Load wallet
  useEffect(() => {
    const loadWallet = async () => {
      try {
        const res = await fetch('/api/wallet/passenger')
        const data = await res.json()
        if (data.success) setWalletBalance(data.data.balance)
      } catch {}
    }
    if (user) loadWallet()
  }, [user])

  // Send tip
  const sendTip = async () => {
    if (!activeRide || tipAmount <= 0) return
    try {
      const res = await fetch('/api/rides/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: activeRide.id, amount: tipAmount, paymentMethod }),
      })
      const data = await res.json()
      if (data.success) {
        setShowTipModal(false)
        setTipAmount(0)
        alert('¡Propina enviada!')
      }
    } catch (error) {
      alert('Error al enviar propina')
    }
  }

  // Schedule ride
  const scheduleRide = async () => {
    if (!origin || !destination || !scheduledDate || !scheduledTime) return
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      const res = await fetch('/api/rides/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originAddress: origin.name,
          originLat: origin.lat,
          originLng: origin.lng,
          destAddress: destination.name,
          destLat: destination.lat,
          destLng: destination.lng,
          scheduledAt,
          notes: scheduledNotes,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowScheduledModal(false)
        setScheduledDate('')
        setScheduledTime('')
        alert('¡Viaje programado!')
      }
    } catch (error) {
      alert('Error al programar viaje')
    }
  }

  // Send chat message
  const sendChatMessage = async () => {
    if (!activeRide || !chatInput.trim()) return
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: activeRide.id, message: chatInput }),
      })
      const data = await res.json()
      if (data.success) {
        setChatMessages(prev => [...prev, data.data])
        setChatInput('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  // Load chat messages
  const loadChatMessages = async (rideId: string) => {
    try {
      const res = await fetch(`/api/chat?rideId=${rideId}`)
      const data = await res.json()
      if (data.success) setChatMessages(data.data)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

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

  // Request ride
  const requestRide = async () => {
    if (!origin || !destination || !selectedVehicle || isRequestingRide) return
    
    setIsRequestingRide(true)
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
          estimatedFare: customPrice,
          vehicleTypeId: selectedVehicle,
        }),
      })
      
      const data = await response.json()
      if (data.success) {
        setActiveRide(data.data.ride)
        alert('¡Viaje solicitado! Buscando conductor cercano...')
        setPanelView('home')
        setDestination(null)
        setSelectedVehicle(null)
        setRideEstimate(null)
      } else {
        alert(data.error || 'Error al solicitar viaje')
      }
    } catch (error) {
      console.error('Error requesting ride:', error)
      alert('Error al solicitar viaje')
    } finally {
      setIsRequestingRide(false)
    }
  }

  // Apply promo code
  const applyPromoCode = async () => {
    if (!promoCode) return
    
    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode }),
      })
      
      const data = await response.json()
      if (data.success) {
        setAppliedPromo({
          code: promoCode,
          discount: data.data.discountPercentage,
          ridesLeft: data.data.totalRides
        })
        setPromoModalOpen(false)
        setPromoCode('')
        alert(`¡Código aplicado! ${data.data.discountPercentage}% de descuento en ${data.data.totalRides} viajes`)
      } else {
        alert(data.error || 'Código inválido')
      }
    } catch (error) {
      console.error('Error applying promo:', error)
      alert('Error al aplicar código')
    }
  }

  // Copy referral code
  const copyReferralCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  // Submit rating
  const submitRating = async () => {
    if (!activeRide) return
    
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId: activeRide.id,
          score: rating,
          comment: ratingComment || undefined,
        }),
      })
      
      const data = await response.json()
      if (data.success) {
        setShowRatingModal(false)
        setRating(5)
        setRatingComment('')
        setActiveRide(null)
        alert('¡Gracias por tu calificación!')
      } else {
        alert(data.error || 'Error al calificar')
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
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

  const handleSelectSuggestion = async (suggestion: SearchSuggestion) => {
    if (selectingField === 'origin') {
      setOrigin(suggestion)
    } else {
      setDestination(suggestion)
      addToHistory(suggestion)
      // Calculate fare estimate
      try {
        const res = await fetch('/api/rides/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originLat: origin.lat,
            originLng: origin.lng,
            destLat: suggestion.lat,
            destLng: suggestion.lng,
            originAddress: origin.name,
            destAddress: suggestion.name,
          }),
        })
        const data = await res.json()
        if (data.success) {
          setRideEstimate(data.data)
        }
      } catch (e) {
        console.error('Estimate error:', e)
      }
    }
    setSearchQuery('')
    setSearchSuggestions([])
    setSelectingField(null)
    if (selectingField === 'destination') {
      setPanelView('vehicles')
    }
  }

  const handleSelectFromHistory = async (place: SearchSuggestion) => {
    if (selectingField === 'origin') {
      setOrigin(place)
    } else {
      setDestination(place)
      // Calculate fare estimate
      try {
        const res = await fetch('/api/rides/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originLat: origin.lat,
            originLng: origin.lng,
            destLat: place.lat,
            destLng: place.lng,
            originAddress: origin.name,
            destAddress: place.name,
          }),
        })
        const data = await res.json()
        if (data.success) setRideEstimate(data.data)
      } catch (e) {
        console.error('Estimate error:', e)
      }
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
        // Calculate fare estimate
        try {
          const estRes = await fetch('/api/rides/estimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              originLat: origin.lat,
              originLng: origin.lng,
              destLat: lat,
              destLng: lng,
              originAddress: origin.name,
              destAddress: name,
            }),
          })
          const estData = await estRes.json()
          if (estData.success) setRideEstimate(estData.data)
        } catch (e) {
          console.error('Estimate error:', e)
        }
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
    { id: '2db9fd01-760d-4561-bd92-bb85e62c5c04', name: 'Moto', capacity: 1, icon: '🏍️', priceMultiplier: 1.0, eta: '3 min', image: '🛵', type: 'moto' },
    { id: 'b3023f91-f02b-4d23-a37f-60c075da3a23', name: 'Económico', capacity: 3, icon: '🚗', priceMultiplier: 1.6, eta: '5 min', image: '🚙', type: 'car' },
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
    return <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: t.bg }}>Cargando...</div>
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: t.bg }}>
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[1100]" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute left-0 top-0 h-full w-80 shadow-xl"
            style={{ backgroundColor: t.accent, color: t.text }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold" style={{ color: t.primaryText }}>RAPIDITO</h1>
                <button onClick={() => setSidebarOpen(false)} style={{ color: t.primaryText }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-between mb-8">
                <p className="text-lg" style={{ color: t.primaryText }}>{user.firstName} {user.lastName}</p>
                <button className="px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2" style={{ backgroundColor: t.primary, color: t.primaryText }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Editar perfil
                </button>
              </div>

              <nav className="space-y-2">
                {[
                  { icon: '🕐', label: 'Historial', action: () => window.location.href = '/passenger/history' },
                  { icon: '💰', label: 'Mi Cartera', action: () => setShowWalletModal(true) },
                  { icon: '📅', label: 'Viajes programados', action: () => setShowScheduledModal(true) },
                  { icon: '🎁', label: 'Referidos', action: () => { setShowReferralModal(true); setSidebarOpen(false) } },
                  { icon: '🎧', label: 'Ayuda y Soporte', action: () => window.location.href = '/passenger/support' },
                  { icon: '🎨', label: 'Estilo y tema', action: () => setThemeMenuOpen(!themeMenuOpen) },
                ].map((item) => (
                  <div key={item.label}>
                    <button
                      onClick={item.action}
                      className="flex items-center gap-4 w-full px-4 py-3 text-left rounded-lg transition-colors hover:bg-white/10"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-lg">{item.label}</span>
                      {item.label === 'Estilo y tema' && (
                        <svg className={`w-4 h-4 ml-auto transition-transform ${themeMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                    {/* Theme Submenu */}
                    {item.label === 'Estilo y tema' && themeMenuOpen && (
                      <div className="ml-4 mt-2 space-y-2">
                        {(Object.keys(themes) as Array<keyof typeof themes>).map((themeKey) => (
                          <button
                            key={themeKey}
                            onClick={() => setTheme(themeKey)}
                            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors ${
                              theme === themeKey ? 'bg-white/20' : 'hover:bg-white/10'
                            }`}
                            style={{ color: 'rgba(255,255,255,0.9)' }}
                          >
                            <span className="text-lg">{themes[themeKey].icon}</span>
                            <span>{themes[themeKey].name}</span>
                            {theme === themeKey && (
                              <svg className="w-5 h-5 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
      <div className="relative z-[1000] shadow-sm" style={{ backgroundColor: t.bgSecondary }}>
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-2xl p-3 hover:opacity-80 transition-opacity"
            style={{ backgroundColor: t.bgTertiary }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: t.text }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 rounded-2xl px-4 py-2 flex items-center gap-2" style={{ backgroundColor: t.bgTertiary }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: t.primary }}>
              <span className="text-xs" style={{ color: t.primaryText }}>💎</span>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: t.text }}>Plata</p>
              <p className="text-xs" style={{ color: t.textSecondary }}>0 km · 10d</p>
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
            <div className="rounded-2xl p-4 glass-card flex items-center gap-3" style={{ backgroundColor: t.bgSecondary }}>
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: t.text }}>¡Bienvenido! Tu seguridad es nuestra prioridad</p>
            </div>
          </div>
        )}

        {/* Compass Button - Overlay on map */}
        <div className="absolute right-4 bottom-4 z-10">
          <button className="glass-card rounded-full p-3">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9l5-5 5 5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="relative z-[1000] glass-panel rounded-t-[2rem]" style={{ backgroundColor: t.bgSecondary }}>
        {/* HOME VIEW */}
        {panelView === 'home' && (
          <div className="relative overflow-hidden">
            <div className="absolute -top-16 -right-16 opacity-15 pointer-events-none">
              <FluidOrb size={180} color="#FF6B00" />
            </div>
            <div className="p-5 space-y-4 relative z-10">
              {/* Where to? Search Bar */}
              <button
                onClick={() => {
                  setPanelView('search')
                  setSelectingField('destination')
                  setTimeout(() => searchInputRef.current?.focus(), 100)
                }}
                className="w-full glass-card rounded-2xl px-5 py-4 flex items-center gap-4 text-left hover:opacity-80 transition-opacity"
              >
                <div className="w-3 h-3 rounded-full bg-black" />
                <span className="text-lg" style={{ color: t.textSecondary }}>Pa' donde vas</span>
              </button>

              {/* Promo Banner */}
              <div className="rounded-2xl p-4 flex items-center gap-4" style={{ backgroundColor: t.primary }}>
                <div className="text-5xl">🎉</div>
                <div>
                  <p className="font-bold text-lg" style={{ color: t.primaryText }}>¡Comparte y gana!</p>
                  <p className="text-sm" style={{ color: `${t.primaryText}cc` }}>Refiere a tus amigos y gana sin limites</p>
                </div>
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 pb-6">
              <div className="w-8 h-2 rounded-full" style={{ backgroundColor: t.primary }} />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.border }} />
            </div>
          </div>
        )}

        {/* SEARCH VIEW */}
        {panelView === 'search' && (
          <div>
            {/* Header with back button */}
            <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: t.border }}>
              <button
                onClick={() => {
                  setPanelView('home')
                  setSearchQuery('')
                  setSearchSuggestions([])
                  setSelectingField(null)
                }}
                className="p-2 rounded-xl hover:opacity-80"
                style={{ backgroundColor: t.bgTertiary }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: t.text }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <p className="font-bold" style={{ color: t.text }}>Pa' donde vas</p>
            </div>

            <div className="p-5 space-y-4">
              {/* Origin */}
              <div className="flex items-center gap-3 rounded-2xl p-4" style={{ backgroundColor: t.bgTertiary }}>
                <div className="w-3 h-3 rounded-full bg-black" />
                <div className="flex-1">
                  <p className="text-xs mb-1" style={{ color: t.textSecondary }}>Origen</p>
                  <p className="text-sm font-medium" style={{ color: t.text }}>{origin?.name || 'Seleccionar origen'}</p>
                </div>
                <button 
                  onClick={() => setSelectingField('origin')}
                  style={{ color: t.textSecondary }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>

              {/* Destination Input */}
              <div className="rounded-2xl p-4" style={{ backgroundColor: t.bgTertiary }}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.primary }} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSelectingField('destination')}
                    placeholder="Pa' donde vas"
                    className="flex-1 text-base bg-transparent outline-none"
                    style={{ color: t.text }}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => {
                        setSearchQuery('')
                        setSearchSuggestions([])
                      }}
                      style={{ color: t.textSecondary }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Loading indicator */}
                {isSearchingPlaces && (
                  <div className="mt-3 flex items-center gap-2" style={{ color: t.textSecondary }}>
                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: t.primary, borderTopColor: 'transparent' }} />
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
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:opacity-80"
                        style={{ backgroundColor: t.bgSecondary }}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${t.primary}20` }}>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: t.primary }}>
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: t.text }}>{suggestion.name.split(',')[0]}</p>
                          <p className="text-xs truncate" style={{ color: t.textSecondary }}>{suggestion.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Map Selection Button */}
                <button
                  onClick={() => setSelectingField('destination')}
                  className="w-full mt-3 rounded-2xl py-3 font-bold text-sm flex items-center justify-center gap-2"
                  style={{ backgroundColor: t.primary, color: t.primaryText }}
                >
                  📍 Señalar la ubicación en el mapa
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  className="flex-1 border rounded-2xl py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium"
                  style={{ borderColor: t.border, color: t.text }}
                >
                  <span>⭐</span> Lugar favorito
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setTripTypeOpen(!tripTypeOpen)}
                    className="rounded-2xl py-3 px-4 text-sm font-medium flex items-center gap-2"
                    style={{ backgroundColor: t.accent, color: t.primaryText }}
                  >
                    {tripType}
                    <svg className={`w-4 h-4 transition-transform ${tripTypeOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {tripTypeOpen && (
                    <div className="absolute right-0 top-full mt-2 rounded-2xl overflow-hidden shadow-xl z-20 w-48" style={{ backgroundColor: t.accent }}>
                      {['Solo ida', 'Ida y vuelta', 'Multi paradas'].map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setTripType(type as any)
                            setTripTypeOpen(false)
                          }}
                          className={`w-full px-4 py-3 text-left text-sm ${tripType === type ? 'bg-white/20' : ''}`}
                          style={{ color: t.primaryText }}
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
                  <p className="text-sm font-medium" style={{ color: t.textSecondary }}>Recientes</p>
                  {searchHistory.slice(0, 5).map((place, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectFromHistory(place)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-colors hover:opacity-80"
                      style={{ backgroundColor: t.bgTertiary }}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: t.border }}>
                        <span className="text-lg">🕐</span>
                      </div>
                      <div>
                        <p className="text-base font-bold" style={{ color: t.text }}>{place.name.split(',')[0]}</p>
                        <p className="text-sm truncate" style={{ color: t.textSecondary }}>{place.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Buttons */}
            <div className="p-5 flex gap-4 border-t" style={{ borderColor: t.border }}>
              <button
                onClick={() => {
                  setPanelView('home')
                  setSearchQuery('')
                  setSearchSuggestions([])
                  setSelectingField(null)
                }}
                className="flex-1 border-2 rounded-2xl py-4 font-bold"
                style={{ borderColor: t.accent, color: t.accent }}
              >
                Volver
              </button>
              <button
                onClick={() => {
                  if (destination) setPanelView('vehicles')
                }}
                className="flex-1 rounded-2xl py-4 font-bold"
                style={{ backgroundColor: t.accent, color: t.primaryText }}
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
            {/* Header with back button */}
            <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: t.border }}>
              <button
                onClick={() => setPanelView('search')}
                className="p-2 rounded-xl hover:opacity-80"
                style={{ backgroundColor: t.bgTertiary }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: t.text }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <p className="font-bold" style={{ color: t.text }}>Selecciona tu vehículo</p>
            </div>

            {/* Origin/Destination Bar */}
            <div className="p-4 border-b" style={{ borderColor: t.border }}>
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: t.bgTertiary }}>
                <div className="flex items-center gap-3 p-3">
                  <div className="w-3 h-3 rounded-full bg-black" />
                  <p className="text-sm truncate flex-1" style={{ color: t.text }}>{origin?.name || 'Origen'}</p>
                </div>
                <div className="flex items-center gap-3 p-3 border-t" style={{ borderColor: t.border }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.primary }} />
                  <p className="text-sm truncate flex-1" style={{ color: t.textSecondary }}>{destination?.name || 'Destino'}</p>
                </div>
              </div>
              <button
                onClick={() => setPanelView('search')}
                className="w-full py-3 rounded-2xl text-sm font-bold mt-3"
                style={{ backgroundColor: t.accent, color: t.primaryText }}
              >
                Toca para cambiar la dirección
              </button>
            </div>

            {/* Promo Code */}
            <div className="p-4">
              {appliedPromo ? (
                <div className="rounded-2xl px-5 py-3 flex items-center justify-between" style={{ backgroundColor: t.primary + '20' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎫</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: t.primary }}>{appliedPromo.code === 'FIRST_RIDE' ? 'Descuento primer viaje' : `Código: ${appliedPromo.code}`}</p>
                      <p className="text-xs" style={{ color: t.textSecondary }}>{appliedPromo.discount}% - {appliedPromo.ridesLeft} viajes restantes</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAppliedPromo(null)}
                    className="p-1 rounded-full"
                    style={{ backgroundColor: t.bgTertiary }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: t.textSecondary }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setPromoModalOpen(true)}
                  className="w-full rounded-2xl px-5 py-3 text-sm font-bold flex items-center gap-2 justify-center" 
                  style={{ backgroundColor: t.accent, color: t.primaryText }}
                >
                  🎫 Agregar código de descuento
                </button>
              )}
            </div>

            {/* Vehicle Options */}
            <div className="px-4 pb-4 flex gap-4 overflow-x-auto">
              {vehicleTypes.map((vehicle) => {
                const basePrice = (rideEstimate?.estimatedFare || 1.0) * vehicle.priceMultiplier
                const discount = getDiscount()
                const discountedPrice = basePrice * (1 - discount / 100)

                return (
                  <button
                    key={vehicle.id}
                    onClick={async () => {
                      setSelectedVehicle(vehicle.id)
                      // Recalculate fare for this vehicle type
                      if (origin && destination) {
                        try {
                          const res = await fetch('/api/rides/estimate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              originLat: origin.lat,
                              originLng: origin.lng,
                              destLat: destination.lat,
                              destLng: destination.lng,
                              originAddress: origin.name,
                              destAddress: destination.name,
                              vehicleType: vehicle.type,
                            }),
                          })
                          const data = await res.json()
                          if (data.success) {
                            const disc = getDiscount()
                            const finalPrice = data.data.estimatedFare * (1 - disc / 100)
                            setRideEstimate({ ...data.data, selectedVehicle: vehicle, estimatedFare: finalPrice })
                            setCustomPrice(finalPrice)
                          }
                        } catch (e) {
                          setRideEstimate({ ...rideEstimate, selectedVehicle: vehicle, estimatedFare: discountedPrice })
                          setCustomPrice(discountedPrice)
                        }
                      } else {
                        setRideEstimate({ ...rideEstimate, selectedVehicle: vehicle, estimatedFare: discountedPrice })
                        setCustomPrice(discountedPrice)
                      }
                      setPanelView('vehicleDetail')
                    }}
                    className="min-w-[160px] rounded-2xl p-5 text-left border-2 border-transparent transition-all"
                    style={{ backgroundColor: t.bgTertiary }}
                  >
                    {discount > 0 && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white px-3 py-1 rounded-full font-bold" style={{ backgroundColor: t.primary }}>-{discount}%</span>
                      </div>
                    )}
                    <p className="font-bold text-lg" style={{ color: t.text }}>{vehicle.name}</p>
                    <p className="text-sm" style={{ color: t.textSecondary }}>👤 {vehicle.capacity}</p>
                    <div className="text-5xl my-4">{vehicle.image}</div>
                    <div>
                      {discount > 0 ? (
                        <>
                          <p className="text-sm line-through" style={{ color: t.textSecondary }}>${basePrice.toFixed(2)} –{discount}%</p>
                          <p className="font-bold text-xl" style={{ color: t.text }}>${discountedPrice.toFixed(2)} ↑</p>
                        </>
                      ) : (
                        <p className="font-bold text-xl" style={{ color: t.text }}>${basePrice.toFixed(2)} ↑</p>
                      )}
                    </div>
                    {rideEstimate?.distance && (
                      <p className="text-xs mt-2" style={{ color: t.textSecondary }}>
                        📍 {rideEstimate.distance} km · {rideEstimate.duration} min
                      </p>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Bottom Buttons */}
            <div className="p-5 flex gap-4 border-t" style={{ borderColor: t.border }}>
              <button
                onClick={() => setPanelView('search')}
                className="flex-1 border-2 rounded-2xl py-4 font-bold"
                style={{ borderColor: t.accent, color: t.accent }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (selectedVehicle) setPanelView('vehicleDetail')
                }}
                className="flex-1 rounded-2xl py-4 font-bold"
                style={{ backgroundColor: t.accent, color: t.primaryText }}
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
            {/* Header with back button */}
            <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: t.border }}>
              <button
                onClick={() => setPanelView('vehicles')}
                className="p-2 rounded-xl hover:opacity-80"
                style={{ backgroundColor: t.bgTertiary }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: t.text }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <p className="font-bold" style={{ color: t.text }}>Opciones de servicio</p>
            </div>
            <div className="p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: t.text }}>{vehicleTypes.find(v => v.id === selectedVehicle)?.name}</h2>
                  <p style={{ color: t.textSecondary }}>Capacidad Máxima</p>
                  <p className="text-lg" style={{ color: t.text }}>👤 {vehicleTypes.find(v => v.id === selectedVehicle)?.capacity}</p>
                  {rideEstimate?.distance && (
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm px-2 py-1 rounded-lg" style={{ backgroundColor: t.bgTertiary, color: t.textSecondary }}>
                        📍 {rideEstimate.distance} km
                      </span>
                      <span className="text-sm px-2 py-1 rounded-lg" style={{ backgroundColor: t.bgTertiary, color: t.textSecondary }}>
                        ⏱️ {rideEstimate.duration} min
                      </span>
                    </div>
                  )}
                  {selectedVehicle === 'moto' && (
                    <p className="text-sm mt-2" style={{ color: t.textSecondary }}>Es necesario el uso del casco para este servicio</p>
                  )}
                </div>
                <div className="text-7xl">{vehicleTypes.find(v => v.id === selectedVehicle)?.image}</div>
              </div>

              {/* Service Options */}
              <div className="space-y-3 mt-6">
                {/* Servicio Rápido */}
                <div className="rounded-2xl p-4 flex items-center justify-between" style={{ backgroundColor: t.bgTertiary }}>
                  <div>
                    <p className="font-bold" style={{ color: t.text }}>Servicio Rápido</p>
                    <p className="text-sm" style={{ color: t.textSecondary }}>Llegada más rápida</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-lg" style={{ color: t.text }}>${((rideEstimate?.estimatedFare || 1.0) * 1.1 * 0.95).toFixed(2)}</span>
                      <span className="text-sm line-through" style={{ color: t.textSecondary }}>${((rideEstimate?.estimatedFare || 1.0) * 1.1).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <span>⚡</span> Más rápido
                    </span>
                    <span className="text-white px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: t.primary }}>5%</span>
                    <button className="px-4 py-2 rounded-2xl text-sm font-bold" style={{ backgroundColor: t.accent, color: t.primaryText }}>
                      Solicitar Rápido
                    </button>
                  </div>
                </div>

                {/* Servicio Normal */}
                <div className="rounded-2xl p-4 flex items-center justify-between" style={{ backgroundColor: t.bgTertiary }}>
                  <div>
                    <p className="font-bold" style={{ color: t.text }}>Servicio Normal</p>
                    <p className="text-sm" style={{ color: t.textSecondary }}>Precio establecido</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-lg" style={{ color: t.text }}>${((rideEstimate?.estimatedFare || 1.0) * 0.95).toFixed(2)}</span>
                      <span className="text-sm line-through" style={{ color: t.textSecondary }}>${(rideEstimate?.estimatedFare || 1.0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: t.primary }}>5%</span>
                    <button 
                      onClick={() => {
                        setCustomPrice((rideEstimate?.estimatedFare || 1.0) * 0.95)
                        setPanelView('ride')
                      }}
                      className="px-4 py-2 rounded-2xl text-sm font-bold"
                      style={{ backgroundColor: t.accent, color: t.primaryText }}
                    >
                      Pedir Ahora
                    </button>
                  </div>
                </div>

                {/* Selecciona cuánto quieres pagar */}
                <div className="rounded-2xl p-4 flex items-center justify-between" style={{ backgroundColor: t.bgTertiary }}>
                  <div>
                    <p className="font-bold" style={{ color: t.text }}>Selecciona cuánto quieres pagar</p>
                    <p className="text-sm" style={{ color: t.textSecondary }}>Elige tú el precio</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getDiscount() > 0 ? (
                        <>
                          <span className="font-bold text-lg" style={{ color: t.text }}>${((rideEstimate?.estimatedFare || 1.0) * (1 - getDiscount() / 100)).toFixed(2)}</span>
                          <span className="text-sm line-through" style={{ color: t.textSecondary }}>${(rideEstimate?.estimatedFare || 1.0).toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="font-bold text-lg" style={{ color: t.text }}>${(rideEstimate?.estimatedFare || 1.0).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getDiscount() > 0 && (
                      <span className="text-white px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: t.primary }}>{getDiscount()}%</span>
                    )}
                    <button 
                      onClick={() => setPanelView('ride')}
                      className="px-4 py-2 rounded-2xl text-sm font-bold"
                      style={{ backgroundColor: t.accent, color: t.primaryText }}
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
            {/* Header with back button */}
            <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: t.border }}>
              <button
                onClick={() => setPanelView('vehicleDetail')}
                className="p-2 rounded-xl hover:opacity-80"
                style={{ backgroundColor: t.bgTertiary }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: t.text }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <p className="font-bold" style={{ color: t.text }}>Confirma tu viaje</p>
            </div>

            {/* Discount Banner */}
            {getDiscount() > 0 && (
              <div className="text-white p-4 flex items-center justify-between" style={{ backgroundColor: t.primary }}>
                <span className="font-bold">{getDiscount()}% Descuento aplicado</span>
                <div className="flex items-center gap-2">
                  <span className="line-through text-white/70">${(customPrice / (1 - getDiscount() / 100)).toFixed(2)}</span>
                  <span className="font-bold text-xl">${customPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="p-5">
              {/* Vehicle Info */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: t.text }}>{vehicleTypes.find(v => v.id === selectedVehicle)?.name}</h2>
                  <p style={{ color: t.textSecondary }}>Capacidad Máxima</p>
                  <p className="text-lg" style={{ color: t.text }}>👤 {vehicleTypes.find(v => v.id === selectedVehicle)?.capacity}</p>
                </div>
                <div className="text-7xl">{vehicleTypes.find(v => v.id === selectedVehicle)?.image}</div>
              </div>

              {/* Price Selection */}
              <div className="rounded-2xl p-5" style={{ backgroundColor: t.bgTertiary }}>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <span className="border px-5 py-2 rounded-2xl font-bold text-lg" style={{ backgroundColor: t.bgSecondary, borderColor: t.border, color: t.text }}>
                    Tarifa Recomendada
                  </span>
                  <span className="text-2xl font-bold" style={{ color: t.text }}>${customPrice.toFixed(2)}</span>
                </div>

                <p className="text-center text-sm mb-4" style={{ color: t.textSecondary }}>Seleccione el monto a pagar</p>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setCustomPrice(prev => Math.max(prev - 0.19, 0.50))}
                    className="text-white px-6 py-3 rounded-2xl font-bold text-lg"
                    style={{ backgroundColor: t.primary }}
                  >
                    –$0.19
                  </button>
                  <span className="text-xl font-bold px-4" style={{ color: t.text }}>{customPrice.toFixed(2)} $</span>
                  <button
                    onClick={() => setCustomPrice(prev => prev + 0.19)}
                    className="text-white px-6 py-3 rounded-2xl font-bold text-lg"
                    style={{ backgroundColor: t.primary }}
                  >
                    +$0.19
                  </button>
                </div>
              </div>

              {/* Start Ride Button */}
              <button 
                onClick={requestRide}
                disabled={isRequestingRide}
                className="w-full rounded-2xl py-5 font-bold mt-6 text-xl disabled:opacity-50" 
                style={{ backgroundColor: t.accent, color: t.primaryText }}
              >
                {isRequestingRide ? 'Buscando conductor...' : 'Comenzar viaje'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Promo Code Modal */}
      {promoModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[2000]" onClick={() => setPromoModalOpen(false)}>
          <div className="w-full max-w-md rounded-t-3xl p-6" style={{ backgroundColor: t.bgSecondary }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: t.border }} />
            <h3 className="text-xl font-bold mb-4" style={{ color: t.text }}>Agregar código de descuento</h3>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Escribe tu código"
                className="flex-1 rounded-2xl px-4 py-3 text-sm"
                style={{ backgroundColor: t.bgTertiary, color: t.text }}
              />
              <button
                onClick={applyPromoCode}
                disabled={!promoCode}
                className="rounded-2xl px-6 py-3 font-bold disabled:opacity-50"
                style={{ backgroundColor: t.accent, color: t.primaryText }}
              >
                Aplicar
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl p-4" style={{ backgroundColor: t.bgTertiary }}>
                <p className="text-sm" style={{ color: t.textSecondary }}>
                  <strong style={{ color: t.text }}>Código de referido:</strong> Pide a un amigo que te comparta su código. Ambos ganan 10% de descuento en 2 viajes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referral Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[2000]" onClick={() => setShowReferralModal(false)}>
          <div className="w-full max-w-md rounded-t-3xl p-6" style={{ backgroundColor: t.bgSecondary }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: t.border }} />
            <h3 className="text-xl font-bold mb-2" style={{ color: t.text }}>Comparte y gana</h3>
            <p className="text-sm mb-4" style={{ color: t.textSecondary }}>Invita a amigos y ambos ganan 10% de descuento en 2 viajes</p>
            
            <div className="rounded-2xl p-4 flex items-center justify-between mb-4" style={{ backgroundColor: t.bgTertiary }}>
              <div>
                <p className="text-xs" style={{ color: t.textSecondary }}>Tu código</p>
                <p className="text-lg font-bold" style={{ color: t.text }}>{referralData?.referralCode || 'Cargando...'}</p>
              </div>
              <button
                onClick={copyReferralCode}
                className="px-4 py-2 rounded-2xl font-bold"
                style={{ backgroundColor: copySuccess ? '#22C55E' : t.accent, color: 'white' }}
              >
                {copySuccess ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>

            <div className="space-y-2 text-sm" style={{ color: t.textSecondary }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">👥</span>
                <span>{referralData?.referralsMade || 0} amigos invitados</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🚗</span>
                <span>{referralData?.ridesCompleted || 0} viajes completados</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'RAPIDITO',
                    text: `Usa mi código ${referralData?.referralCode} para obtener 10% de descuento en tus primeros 2 viajes en RAPIDITO!`,
                  })
                }
              }}
              className="w-full mt-4 rounded-2xl py-3 font-bold"
              style={{ backgroundColor: t.primary, color: 'white' }}
            >
              📱 Compartir código
            </button>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]" onClick={() => setShowRatingModal(false)}>
          <div className="w-full max-w-md rounded-3xl p-6 mx-4" style={{ backgroundColor: t.bgSecondary }} onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-center" style={{ color: t.text }}>Califica tu viaje</h3>
            
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="text-4xl">
                  {star <= rating ? '⭐' : '☆'}
                </button>
              ))}
            </div>

            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Comentario opcional..."
              className="w-full rounded-2xl px-4 py-3 text-sm mb-4"
              style={{ backgroundColor: t.bgTertiary, color: t.text }}
              rows={3}
            />

            <button
              onClick={submitRating}
              className="w-full rounded-2xl py-3 font-bold"
              style={{ backgroundColor: t.accent, color: t.primaryText }}
            >
              Enviar calificación
            </button>
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[2000]" onClick={() => setShowWalletModal(false)}>
          <div className="w-full max-w-md rounded-t-3xl p-6" style={{ backgroundColor: t.bgSecondary }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: t.border }} />
            <h3 className="text-xl font-bold mb-4" style={{ color: t.text }}>Mi Cartera</h3>
            
            <div className="rounded-2xl p-6 text-center mb-4" style={{ backgroundColor: t.primary }}>
              <p className="text-white/80 text-sm">Saldo disponible</p>
              <p className="text-4xl font-bold text-white">${walletBalance.toFixed(2)}</p>
            </div>

            {/* Pago Móvil data */}
            <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: t.bgTertiary }}>
              <p className="text-sm font-bold mb-2" style={{ color: t.text }}>📱 Para recargar tu cartera:</p>
              <div className="space-y-1 text-sm" style={{ color: t.textSecondary }}>
                <p><strong>Banco:</strong> 0102</p>
                <p><strong>Teléfono:</strong> 04125203740</p>
                <p><strong>Cédula:</strong> 29673250</p>
                <p><strong>Nombre:</strong> Rapidito C.A.</p>
              </div>
              <p className="text-xs mt-2" style={{ color: t.textSecondary }}>Después de transferir, envía el comprobante por Telegram</p>
            </div>

            <div className="space-y-2">
              <button className="w-full rounded-2xl py-3 font-bold border-2" style={{ borderColor: t.border, color: t.text }}>
                📊 Ver movimientos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Ride Modal */}
      {showScheduledModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[2000]" onClick={() => setShowScheduledModal(false)}>
          <div className="w-full max-w-md rounded-t-3xl p-6" style={{ backgroundColor: t.bgSecondary }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: t.border }} />
            <h3 className="text-xl font-bold mb-4" style={{ color: t.text }}>Programar viaje</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm mb-1 block" style={{ color: t.textSecondary }}>Fecha</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-2xl px-4 py-3 text-sm"
                  style={{ backgroundColor: t.bgTertiary, color: t.text }}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="text-sm mb-1 block" style={{ color: t.textSecondary }}>Hora</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full rounded-2xl px-4 py-3 text-sm"
                  style={{ backgroundColor: t.bgTertiary, color: t.text }}
                />
              </div>
              <div>
                <label className="text-sm mb-1 block" style={{ color: t.textSecondary }}>Notas (opcional)</label>
                <input
                  type="text"
                  value={scheduledNotes}
                  onChange={(e) => setScheduledNotes(e.target.value)}
                  placeholder="Ej: Near the park..."
                  className="w-full rounded-2xl px-4 py-3 text-sm"
                  style={{ backgroundColor: t.bgTertiary, color: t.text }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowScheduledModal(false)}
                className="flex-1 rounded-2xl py-3 font-bold border-2"
                style={{ borderColor: t.border, color: t.text }}
              >
                Cancelar
              </button>
              <button
                onClick={scheduleRide}
                disabled={!scheduledDate || !scheduledTime}
                className="flex-1 rounded-2xl py-3 font-bold disabled:opacity-50"
                style={{ backgroundColor: t.accent, color: t.primaryText }}
              >
                Programar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[2000]" onClick={() => setShowPaymentModal(false)}>
          <div className="w-full max-w-md rounded-t-3xl p-6" style={{ backgroundColor: t.bgSecondary }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: t.border }} />
            <h3 className="text-xl font-bold mb-4" style={{ color: t.text }}>¿Cómo vas a pagar?</h3>
            
            <div className="space-y-2">
              {[
                { id: 'cash', name: 'Efectivo', icon: '💵', desc: 'Paga al conductor cuando te subas' },
                { id: 'pago_movil', name: 'Pago Móvil / Transferencia', icon: '📱', desc: 'Banco 0102 • Teléfono 04125203740' },
                { id: 'cartera', name: 'Cartera RAPIDITO', icon: '💰', desc: `Saldo: $${walletBalance.toFixed(2)}` },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => { setPaymentMethod(method.id); setShowPaymentModal(false) }}
                  className={`w-full rounded-2xl p-4 flex items-center gap-3 ${paymentMethod === method.id ? 'ring-2' : ''}`}
                  style={{ backgroundColor: t.bgTertiary }}
                >
                  <span className="text-2xl">{method.icon}</span>
                  <div className="text-left">
                    <p className="font-bold" style={{ color: t.text }}>{method.name}</p>
                    <p className="text-xs" style={{ color: t.textSecondary }}>{method.desc}</p>
                  </div>
                  {paymentMethod === method.id && (
                    <svg className="w-6 h-6 ml-auto" fill="currentColor" viewBox="0 0 24 24" style={{ color: t.primary }}>
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[2000]" onClick={() => setShowTipModal(false)}>
          <div className="w-full max-w-md rounded-t-3xl p-6" style={{ backgroundColor: t.bgSecondary }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: t.border }} />
            <h3 className="text-xl font-bold mb-2 text-center" style={{ color: t.text }}>Propina para el conductor</h3>
            <p className="text-sm text-center mb-4" style={{ color: t.textSecondary }}>Muestra tu agradecimiento</p>
            
            <div className="flex justify-center gap-3 mb-4">
              {[1, 2, 3, 5].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTipAmount(amount)}
                  className={`w-16 h-16 rounded-2xl font-bold text-lg ${tipAmount === amount ? 'ring-2' : ''}`}
                  style={{ backgroundColor: tipAmount === amount ? t.primary : t.bgTertiary, color: tipAmount === amount ? 'white' : t.text }}
                >
                  ${amount}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTipModal(false)}
                className="flex-1 rounded-2xl py-3 font-bold border-2"
                style={{ borderColor: t.border, color: t.text }}
              >
                Saltar
              </button>
              <button
                onClick={sendTip}
                disabled={tipAmount <= 0}
                className="flex-1 rounded-2xl py-3 font-bold disabled:opacity-50"
                style={{ backgroundColor: t.accent, color: t.primaryText }}
              >
                Enviar ${tipAmount}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[2000]" onClick={() => setShowChatModal(false)}>
          <div className="w-full max-w-md rounded-t-3xl flex flex-col" style={{ backgroundColor: t.bgSecondary, height: '70vh' }} onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: t.border }}>
              <h3 className="font-bold" style={{ color: t.text }}>Chat con conductor</h3>
              <button onClick={() => setShowChatModal(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: t.textSecondary }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-center text-sm" style={{ color: t.textSecondary }}>Envía un mensaje al conductor</p>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderRole === 'PASSENGER' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.senderRole === 'PASSENGER' ? '' : ''}`}
                      style={{ backgroundColor: msg.senderRole === 'PASSENGER' ? t.primary : t.bgTertiary, color: msg.senderRole === 'PASSENGER' ? 'white' : t.text }}>
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-60 mt-1">{new Date(msg.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t flex gap-2" style={{ borderColor: t.border }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 rounded-2xl px-4 py-2 text-sm"
                style={{ backgroundColor: t.bgTertiary, color: t.text }}
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50"
                style={{ backgroundColor: t.primary }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
