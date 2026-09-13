'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'

interface Place {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  icon: string
}

const DEFAULT_PLACES: Place[] = [
  { id: 'home', name: 'Casa', address: 'Mi dirección guardada', lat: 0, lng: 0, icon: '🏠' },
  { id: 'work', name: 'Trabajo', address: 'Mi trabajo guardado', lat: 0, lng: 0, icon: '💼' },
]

interface PlaceSelectorProps {
  label: string
  icon: string
  value: string
  onChange: (value: string) => void
  onPlaceSelect?: (place: Place) => void
  onMapSelect?: () => void
  placeholder?: string
  currentLocation?: { lat: number; lng: number } | null
}

export function PlaceSelector({
  label,
  icon,
  value,
  onChange,
  onPlaceSelect,
  onMapSelect,
  placeholder = 'Buscar dirección...',
  currentLocation,
}: PlaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<Place[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSearchQuery(value)
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchPlaces = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      return
    }

    setIsSearching(true)
    try {
      const lat = currentLocation?.lat || 9.3167
      const lng = currentLocation?.lng || -70.6045
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es',
          },
        }
      )
      const data = await response.json()

      const places: Place[] = data.map((item: any) => ({
        id: item.place_id.toString(),
        name: item.display_name.split(',')[0],
        address: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        icon: '📍',
      }))

      setSuggestions(places)
    } catch (error) {
      console.error('Error searching places:', error)
      setSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onChange(query)
    setIsOpen(true)

    const timeoutId = setTimeout(() => {
      searchPlaces(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  const handleSelectPlace = (place: Place) => {
    setSearchQuery(place.name)
    onChange(place.name)
    onPlaceSelect?.(place)
    setIsOpen(false)
    setSuggestions([])
  }

  const handleCurrentLocation = () => {
    if (currentLocation) {
      setSearchQuery('Mi ubicación actual')
      onChange('Mi ubicación actual')
      onPlaceSelect?.({
        id: 'current',
        name: 'Mi ubicación actual',
        address: 'Ubicación actual',
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        icon: '📍',
      })
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
        <span>{icon}</span> {label}
      </label>

      <div className="relative mt-1">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="pr-10"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg">
          {/* Current Location */}
          {currentLocation && (
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-b"
              onClick={handleCurrentLocation}
            >
              <span className="text-xl">📍</span>
              <div>
                <p className="font-medium text-gray-900">Mi ubicación actual</p>
                <p className="text-xs text-gray-500">Usar GPS del dispositivo</p>
              </div>
            </button>
          )}

          {/* Map Selection */}
          {onMapSelect && (
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-b"
              onClick={() => {
                setIsOpen(false)
                onMapSelect()
              }}
            >
              <span className="text-xl">🗺️</span>
              <div>
                <p className="font-medium text-gray-900">Seleccionar en el mapa</p>
                <p className="text-xs text-gray-500">Toca el mapa para elegir</p>
              </div>
            </button>
          )}

          {/* Saved Places */}
          {DEFAULT_PLACES.map((place) => (
            <button
              key={place.id}
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-b"
              onClick={() => handleSelectPlace(place)}
            >
              <span className="text-xl">{place.icon}</span>
              <div>
                <p className="font-medium text-gray-900">{place.name}</p>
                <p className="text-xs text-gray-500">{place.address}</p>
              </div>
            </button>
          ))}

          {/* Search Results */}
          {suggestions.length > 0 && (
            <div className="border-t">
              {suggestions.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                  onClick={() => handleSelectPlace(place)}
                >
                  <span className="text-xl">📍</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{place.name}</p>
                    <p className="text-xs text-gray-500 truncate">{place.address}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isSearching && searchQuery.length >= 3 && suggestions.length === 0 && (
            <div className="px-4 py-3 text-center text-sm text-gray-500">
              No se encontraron resultados
            </div>
          )}
        </div>
      )}
    </div>
  )
}