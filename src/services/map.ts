import type { Coordinates, MapRoute } from '@/types'

// MapProvider abstraction for flexibility
export interface MapProvider {
  getRoute(origin: Coordinates, destination: Coordinates): Promise<MapRoute>
  reverseGeocode(lat: number, lng: number): Promise<string>
  geocode(address: string): Promise<Coordinates>
  getDistance(origin: Coordinates, destination: Coordinates): Promise<number>
  getEta(origin: Coordinates, destination: Coordinates): Promise<number>
}

// OpenStreetMap + OSRM implementation
export class OpenStreetMapProvider implements MapProvider {
  private osrmBaseUrl = 'https://router.project-osrm.org'
  private nominatimBaseUrl = 'https://nominatim.openstreetmap.org'

  async getRoute(origin: Coordinates, destination: Coordinates): Promise<MapRoute> {
    const url = `${this.osrmBaseUrl}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
    
    const response = await fetch(url)
    const data = await response.json()

    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new Error('Could not calculate route')
    }

    const route = data.routes[0]
    return {
      distance: route.distance / 1000, // Convert to km
      duration: route.duration / 60, // Convert to minutes
      geometry: route.geometry,
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    const url = `${this.nominatimBaseUrl}/reverse?lat=${lat}&lon=${lng}&format=json`
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'RAPIDITO/1.0' },
    })
    const data = await response.json()

    return data.display_name || 'Unknown location'
  }

  async geocode(address: string): Promise<Coordinates> {
    const url = `${this.nominatimBaseUrl}/search?q=${encodeURIComponent(address)}&format=json&limit=1`
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'RAPIDITO/1.0' },
    })
    const data = await response.json()

    if (!data.length) {
      throw new Error('Address not found')
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    }
  }

  async getDistance(origin: Coordinates, destination: Coordinates): Promise<number> {
    const route = await this.getRoute(origin, destination)
    return route.distance
  }

  async getEta(origin: Coordinates, destination: Coordinates): Promise<number> {
    const route = await this.getRoute(origin, destination)
    return route.duration
  }
}

// Factory
export function createMapProvider(): MapProvider {
  const provider = process.env.MAP_PROVIDER || 'openstreetmap'
  
  switch (provider) {
    case 'openstreetmap':
      return new OpenStreetMapProvider()
    // Add other providers here (Google Maps, Mapbox, etc.)
    default:
      return new OpenStreetMapProvider()
  }
}

// Singleton
let mapProvider: MapProvider | null = null

export function getMapProvider(): MapProvider {
  if (!mapProvider) {
    mapProvider = createMapProvider()
  }
  return mapProvider
}
