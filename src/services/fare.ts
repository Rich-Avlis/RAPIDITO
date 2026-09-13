import type { FareCalculation, Coordinates } from '@/types'

// =============================================
// TABULADOR DE TARIFAS RAPIDITO - Quíbor, Lara
// =============================================
// Sistema de tarifas por distancia con recargo nocturno
// Base: $1.00 + $0.25/km (dentro de Quíbor)
// Las tarifas internas mapean a los rangos conocidos:
//   - Dentro de Quíbor: $1.00 - $1.50
//   - Barrios lejanos: $1.50 - $2.00
//   - Pueblos cercanos: $2.00 - $2.50
//   - Distancias largas: desde $2.50

// Configuración de tarifas por zona
interface TariffConfig {
  baseFare: number        // Tarifa base
  pricePerKm: number      // Precio por kilómetro
  nightSurcharge: number  // Recargo nocturno fijo (7pm-5am)
  minimumFare: number     // Tarifa mínima
  maximumFare: number     // Tope máximo
}

// Tarifas configurables por zona
const TARIFFS: Record<string, TariffConfig> = {
  // Dentro de Quíbor (0-3 km)
  'quibor-centro': {
    baseFare: 1.00,
    pricePerKm: 0.00,   // Sin costo adicional por km dentro de Quíbor
    nightSurcharge: 0.25,
    minimumFare: 1.00,
    maximumFare: 1.00,  // Tope fijo $1.00
  },
  // Barrios lejanos (3-6 km)
  'quibor-periferia': {
    baseFare: 1.00,
    pricePerKm: 0.10,
    nightSurcharge: 0.50,
    minimumFare: 1.00,
    maximumFare: 1.50,
  },
  // Pueblos cercanos (6-12 km)
  'pueblos-cercanos': {
    baseFare: 1.50,
    pricePerKm: 0.08,
    nightSurcharge: 0.50,
    minimumFare: 2.00,
    maximumFare: 2.50,
  },
  // Distancias largas (12+ km)
  'distancia-larga': {
    baseFare: 2.00,
    pricePerKm: 0.05,
    nightSurcharge: 0.75,
    minimumFare: 2.50,
    maximumFare: 5.00,
  },
}

// Lugares conocidos de Quíbor y alrededores con sus zonas
const KNOWN_PLACES: Record<string, string> = {
  // Quíbor centro (zona 1)
  'plaza bolivar': 'quibor-centro',
  'centro quibor': 'quibor-centro',
  'iglesia': 'quibor-centro',
  'mercado': 'quibor-centro',
  'casa de la cultura': 'quibor-centro',
  'parque': 'quibor-centro',
  'municipio': 'quibor-centro',

  // Barrios de Quíbor (zona 1-2)
  'jacinto lara': 'quibor-centro',
  'bello monte': 'quibor-centro',
  'el kenya': 'quibor-centro',
  'la block': 'quibor-centro',
  'los residentes': 'quibor-centro',
  'los rodriguez': 'quibor-centro',
  'el rosario': 'quibor-centro',
  'san jose': 'quibor-centro',
  'la firmly': 'quibor-centro',
  'urbe': 'quibor-centro',
  'ucla': 'quibor-centro',

  // Barrios lejanos (zona 2)
  'tintorero': 'quibor-periferia',
  'los puertos': 'quibor-periferia',
  'losundry': 'quibor-periferia',
  'paraíso': 'quibor-periferia',
  'la every': 'quibor-periferia',

  // Pueblos cercanos (zona 3)
  'cuara': 'pueblos-cercanos',
  'guadalupe': 'pueblos-cercanos',
  'tambor': 'pueblos-cercanos',
  'sanare': 'pueblos-cercanos',
  'distribuidor': 'pueblos-cercanos',
  'siquisique': 'pueblos-cercanos',

  // Distancias largas (zona 4)
  'barquisimeto': 'distancia-larga',
  'carora': 'distancia-larga',
  'tocuyo': 'distancia-larga',
  'acamica': 'distancia-larga',
}

// Distancia máxima para cada zona (en km)
const ZONE_MAX_DISTANCE: Record<string, number> = {
  'quibor-centro': 3,
  'quibor-periferia': 6,
  'pueblos-cercanos': 12,
  'distancia-larga': 999,
}

function isNightTime(): boolean {
  const hour = new Date().getHours()
  return hour >= 19 || hour < 5
}

function detectZone(originName: string, destName: string, distanceKm: number): string {
  // Buscar destino en lugares conocidos
  const destKey = Object.keys(KNOWN_PLACES).find(key =>
    destName.toLowerCase().includes(key)
  )

  if (destKey) {
    return KNOWN_PLACES[destKey]
  }

  // Buscar origen en lugares conocidos
  const originKey = Object.keys(KNOWN_PLACES).find(key =>
    originName.toLowerCase().includes(key)
  )

  if (originKey) {
    return KNOWN_PLACES[originKey]
  }

  // Detectar zona por distancia
  if (distanceKm <= 3) return 'quibor-centro'
  if (distanceKm <= 6) return 'quibor-periferia'
  if (distanceKm <= 12) return 'pueblos-cercanos'
  return 'distancia-larga'
}

export async function calculateFare(
  origin: Coordinates,
  destination: Coordinates,
  distanceKm: number,
  durationMinutes: number,
  originAddress: string = '',
  destAddress: string = ''
): Promise<FareCalculation> {
  const night = isNightTime()

  // Detectar zona
  const zoneKey = detectZone(originAddress, destAddress, distanceKm)
  const tariff = TARIFFS[zoneKey]

  // Calcular tarifa base por distancia
  let fare = tariff.baseFare + (distanceKm * tariff.pricePerKm)

  // Aplicar tope de zona (para que no se pase del rango)
  fare = Math.min(fare, tariff.maximumFare)

  // Aplicar tarifa mínima
  fare = Math.max(fare, tariff.minimumFare)

  // Dentro de Quíbor: siempre $1.00 (día)
  if (zoneKey === 'quibor-centro' && !night) {
    fare = 1.00
  }

  // Recargo nocturno (después de las 7pm)
  if (night) {
    fare += tariff.nightSurcharge
  }

  // Redondear al cuarto más cercano ($0.25)
  fare = Math.round(fare * 4) / 4

  return {
    baseFare: tariff.baseFare,
    distanceFare: distanceKm * tariff.pricePerKm,
    timeFare: 0,
    zoneMultiplier: 1.0,
    demandMultiplier: 1.0,
    nightMultiplier: night ? (tariff.nightSurcharge / tariff.baseFare) + 1 : 1.0,
    discount: 0,
    total: Math.round(fare * 100) / 100,
    minimum: tariff.minimumFare,
  }
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

export function calculateEta(distanceKm: number, avgSpeedKmH: number = 25): number {
  return Math.ceil((distanceKm / avgSpeedKmH) * 60)
}
