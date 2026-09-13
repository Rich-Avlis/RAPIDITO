'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Next.js
const defaultIcon = L.divIcon({
  html: `<div style="background:#FF6B00;width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <span style="color:white;font-size:14px;">📍</span>
  </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

const driverIcon = L.divIcon({
  html: `<div style="background:#FF6B00;width:40px;height:40px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <span style="font-size:18px;">🏍️</span>
  </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
})

const passengerIcon = L.divIcon({
  html: `<div style="background:#22C55E;width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <span style="font-size:16px;">🚶</span>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
})

const pickupIcon = L.divIcon({
  html: `<div style="background:#22C55E;width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <span style="font-size:16px;">📍</span>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
})

const destinationIcon = L.divIcon({
  html: `<div style="background:#EF4444;width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <span style="font-size:16px;">🏁</span>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
})

interface MapMarker {
  id: string
  position: [number, number]
  type: 'driver' | 'passenger' | 'pickup' | 'destination'
  label?: string
}

interface MapViewProps {
  center?: [number, number]
  zoom?: number
  markers?: MapMarker[]
  className?: string
  onLocationSelect?: (lat: number, lng: number) => void
}

function MapEvents({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  const map = useMap()
  
  useEffect(() => {
    if (!onLocationSelect) return
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    }
    
    map.on('click', handleClick)
    return () => { map.off('click', handleClick) }
  }, [map, onLocationSelect])
  
  return null
}

export function MapView({
  center = [9.3167, -70.6045], // Quíbor default
  zoom = 14,
  markers = [],
  className = '',
  onLocationSelect,
}: MapViewProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-xl ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-gray-500">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`rounded-xl ${className}`}
      style={{ height: '100%', width: '100%', zIndex: 1 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents onLocationSelect={onLocationSelect} />
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={marker.position}
          icon={
            marker.type === 'driver' ? driverIcon :
            marker.type === 'passenger' ? passengerIcon :
            marker.type === 'pickup' ? pickupIcon :
            marker.type === 'destination' ? destinationIcon :
            defaultIcon
          }
        >
          {marker.label && <Popup>{marker.label}</Popup>}
        </Marker>
      ))}
    </MapContainer>
  )
}