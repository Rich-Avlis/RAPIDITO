import type { FareCalculation, Coordinates } from '@/types'

// =============================================
// TABULADOR DE TARIFAS RAPIDITO
// Quíbor, Lara + Barquisimeto, Lara
// =============================================
// Precios en dólares (USD) - Venezuela 2026
// Tarifas por zona con recargo nocturno y hora pico

interface TariffConfig {
  baseFare: number
  pricePerKm: number
  pricePerMin: number
  nightSurcharge: number     // Recargo nocturno 7pm-5am
  rushSurcharge: number      // Recargo hora pico 7am-9am, 5pm-7pm
  minimumFare: number
  maximumFare: number
  vehicleMultiplier: number  // 1.0 moto, 1.5 carro
}

// =============================================
// TABULADOR POR ZONA - QUÍBOR
// =============================================
const QUIBOR_TARIFFS: Record<string, TariffConfig> = {
  // Dentro del centro de Quíbor (0-2 km)
  'quibor-centro': {
    baseFare: 1.00,
    pricePerKm: 0.00,
    pricePerMin: 0.00,
    nightSurcharge: 0.25,
    rushSurcharge: 0.00,
    minimumFare: 1.00,
    maximumFare: 1.00,
    vehicleMultiplier: 1.0,
  },
  // Barrios periféricos de Quíbor (2-5 km)
  'quibor-barrios': {
    baseFare: 1.00,
    pricePerKm: 0.15,
    pricePerMin: 0.02,
    nightSurcharge: 0.25,
    rushSurcharge: 0.10,
    minimumFare: 1.00,
    maximumFare: 2.00,
    vehicleMultiplier: 1.0,
  },
  // Zona rural Quíbor (5-10 km)
  'quibor-rural': {
    baseFare: 1.50,
    pricePerKm: 0.20,
    pricePerMin: 0.03,
    nightSurcharge: 0.50,
    rushSurcharge: 0.15,
    minimumFare: 2.00,
    maximumFare: 3.50,
    vehicleMultiplier: 1.0,
  },
}

// =============================================
// TABULADOR POR ZONA - BARQUISIMETO
// =============================================
const BARQUISIMETO_TARIFFS: Record<string, TariffConfig> = {
  // Centro de Barquisimeto (0-3 km)
  'bqto-centro': {
    baseFare: 1.50,
    pricePerKm: 0.10,
    pricePerMin: 0.02,
    nightSurcharge: 0.50,
    rushSurcharge: 0.25,
    minimumFare: 1.50,
    maximumFare: 2.50,
    vehicleMultiplier: 1.0,
  },
  // Barrios de Barquisimeto (3-8 km)
  'bqto-barrios': {
    baseFare: 1.50,
    pricePerKm: 0.20,
    pricePerMin: 0.03,
    nightSurcharge: 0.50,
    rushSurcharge: 0.25,
    minimumFare: 2.00,
    maximumFare: 4.00,
    vehicleMultiplier: 1.0,
  },
  // Zonas lejanas Bqto (8-15 km)
  'bqto-lejano': {
    baseFare: 2.00,
    pricePerKm: 0.25,
    pricePerMin: 0.04,
    nightSurcharge: 0.75,
    rushSurcharge: 0.30,
    minimumFare: 3.00,
    maximumFare: 6.00,
    vehicleMultiplier: 1.0,
  },
  // Periferia Bqto (15+ km)
  'bqto-periferia': {
    baseFare: 2.50,
    pricePerKm: 0.30,
    pricePerMin: 0.05,
    nightSurcharge: 0.75,
    rushSurcharge: 0.35,
    minimumFare: 4.00,
    maximumFare: 8.00,
    vehicleMultiplier: 1.0,
  },
}

// =============================================
// TABULADOR INTERCIUDAD - QUÍBOR ↔ BARQUISIMETO
// =============================================
const INTERCITY_TARIFFS: Record<string, TariffConfig> = {
  // Quíbor ↔ Barquisimeto (~25 km)
  'quibor-bqto': {
    baseFare: 4.00,
    pricePerKm: 0.30,
    pricePerMin: 0.05,
    nightSurcharge: 1.00,
    rushSurcharge: 0.50,
    minimumFare: 5.00,
    maximumFare: 12.00,
    vehicleMultiplier: 1.0,
  },
  // Quíbor ↔ otros pueblos cercanos
  'quibor-pueblo': {
    baseFare: 2.00,
    pricePerKm: 0.25,
    pricePerMin: 0.04,
    nightSurcharge: 0.50,
    rushSurcharge: 0.20,
    minimumFare: 2.50,
    maximumFare: 6.00,
    vehicleMultiplier: 1.0,
  },
  // Barquisimeto ↔ otras ciudades
  'bqto-ciudad': {
    baseFare: 5.00,
    pricePerKm: 0.35,
    pricePerMin: 0.06,
    nightSurcharge: 1.50,
    rushSurcharge: 0.50,
    minimumFare: 6.00,
    maximumFare: 20.00,
    vehicleMultiplier: 1.0,
  },
}

// =============================================
// LUGARES CONOCIDOS → ZONA
// =============================================
const KNOWN_PLACES: Record<string, { zone: string; city: string }> = {
  // === QUÍBOR CENTRO ===
  'plaza bolivar': { zone: 'quibor-centro', city: 'quibor' },
  'centro quibor': { zone: 'quibor-centro', city: 'quibor' },
  'iglesia': { zone: 'quibor-centro', city: 'quibor' },
  'mercado': { zone: 'quibor-centro', city: 'quibor' },
  'casa de la cultura': { zone: 'quibor-centro', city: 'quibor' },
  'parque': { zone: 'quibor-centro', city: 'quibor' },
  'municipio': { zone: 'quibor-centro', city: 'quibor' },
  'calle principal': { zone: 'quibor-centro', city: 'quibor' },

  // === QUÍBOR BARRIOS ===
  'jacinto lara': { zone: 'quibor-barrios', city: 'quibor' },
  'bello monte': { zone: 'quibor-barrios', city: 'quibor' },
  'el kenya': { zone: 'quibor-barrios', city: 'quibor' },
  'la block': { zone: 'quibor-barrios', city: 'quibor' },
  'los residentes': { zone: 'quibor-barrios', city: 'quibor' },
  'los rodriguez': { zone: 'quibor-barrios', city: 'quibor' },
  'el rosario': { zone: 'quibor-barrios', city: 'quibor' },
  'san jose': { zone: 'quibor-barrios', city: 'quibor' },
  'la firmly': { zone: 'quibor-barrios', city: 'quibor' },
  'urbe': { zone: 'quibor-barrios', city: 'quibor' },
  'ucla': { zone: 'quibor-barrios', city: 'quibor' },
  'tintorero': { zone: 'quibor-barrios', city: 'quibor' },
  'los puertos': { zone: 'quibor-barrios', city: 'quibor' },
  'losundry': { zone: 'quibor-barrios', city: 'quibor' },
  'paraíso': { zone: 'quibor-barrios', city: 'quibor' },
  'la every': { zone: 'quibor-barrios', city: 'quibor' },

  // === QUÍBOR RURAL ===
  'cuara': { zone: 'quibor-rural', city: 'quibor' },
  'guadalupe': { zone: 'quibor-rural', city: 'quibor' },
  'tambor': { zone: 'quibor-rural', city: 'quibor' },
  'sanare': { zone: 'quibor-rural', city: 'quibor' },
  'distribuidor': { zone: 'quibor-rural', city: 'quibor' },
  'siquisique': { zone: 'quibor-rural', city: 'quibor' },

  // === BARQUISIMETO CENTRO ===
  'centro barquisimeto': { zone: 'bqto-centro', city: 'barquisimeto' },
  'ob barquisimeto': { zone: 'bqto-centro', city: 'barquisimeto' },
  'avenida brazil': { zone: 'bqto-centro', city: 'barquisimeto' },
  'avenida ferrero': { zone: 'bqto-centro', city: 'barquisimeto' },
  'catedral': { zone: 'bqto-centro', city: 'barquisimeto' },
  'polideportivo': { zone: 'bqto-centro', city: 'barquisimeto' },
  'obelisco': { zone: 'bqto-centro', city: 'barquisimeto' },
  'plaza venezuela': { zone: 'bqto-centro', city: 'barquisimeto' },

  // === BARQUISIMETO BARRIOS ===
  'las mercedes': { zone: 'bqto-barrios', city: 'barquisimeto' },
  'la Concordia': { zone: 'bqto-barrios', city: 'barquisimeto' },
  'san jacinto': { zone: 'bqto-barrios', city: 'barquisimeto' },
  'el sucre': { zone: 'bqto-barrios', city: 'barquisimeto' },
  'los blocked': { zone: 'bqto-barrios', city: 'barquisimeto' },
  'cuatricentenario': { zone: 'bqto-barrios', city: 'barquisimeto' },
  'los trinitarios': { zone: 'bqto-barrios', city: 'barquisimeto' },
  'santa rita': { zone: 'bqto-barrios', city: 'barquisimeto' },
  '2000': { zone: 'bqto-barrios', city: 'barquisimeto' },
  'los andes': { zone: 'bqto-barrios', city: 'barquisimeto' },

  // === BARQUISIMETO ZONA LEJANA ===
  'barquisimeto': { zone: 'bqto-lejano', city: 'barquisimeto' },
  'tacao': { zone: 'bqto-lejano', city: 'barquisimeto' },
  'anzoátegui': { zone: 'bqto-lejano', city: 'barquisimeto' },
  'quisquirí': { zone: 'bqto-lejano', city: 'barquisimeto' },

  // === CIUDADES INTERCIUDAD ===
  'carora': { zone: 'bqto-ciudad', city: 'carora' },
  'tocuyo': { zone: 'bqto-ciudad', city: 'tocuyo' },
  'acamica': { zone: 'bqto-ciudad', city: 'acamica' },
  'barcelona': { zone: 'bqto-ciudad', city: 'barcelona' },
  'cabudare': { zone: 'bqto-ciudad', city: 'cabudare' },
  'el tumo': { zone: 'bqto-ciudad', city: 'el tumo' },
}

// Coordenadas de referencia
const CITY_CENTERS: Record<string, Coordinates> = {
  quibor: { lat: 9.3167, lng: -70.6045 },
  barquisimeto: { lat: 10.0647, lng: -69.3570 },
  carora: { lat: 10.1734, lng: -70.0762 },
  tocuyo: { lat: 9.9286, lng: -70.7344 },
}

function isNightTime(): boolean {
  const hour = new Date().getHours()
  return hour >= 19 || hour < 5
}

function isRushHour(): boolean {
  const hour = new Date().getHours()
  return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)
}

function detectZone(
  originName: string,
  destName: string,
  distanceKm: number,
  originCoords?: Coordinates,
  destCoords?: Coordinates
): { tariff: TariffConfig; zoneKey: string; city: string } {
  const lowerOrigin = originName.toLowerCase()
  const lowerDest = destName.toLowerCase()

  // Buscar destino en lugares conocidos
  for (const [key, value] of Object.entries(KNOWN_PLACES)) {
    if (lowerDest.includes(key)) {
      const tariffSet = getTariffSet(value.city)
      return { tariff: tariffSet[value.zone], zoneKey: value.zone, city: value.city }
    }
  }

  // Buscar origen en lugares conocidos
  for (const [key, value] of Object.entries(KNOWN_PLACES)) {
    if (lowerOrigin.includes(key)) {
      const tariffSet = getTariffSet(value.city)
      return { tariff: tariffSet[value.zone], zoneKey: value.zone, city: value.city }
    }
  }

  // Detectar por ciudad usando coordenadas
  if (originCoords && destCoords) {
    const distToQuibor = haversine(originCoords.lat, originCoords.lng, CITY_CENTERS.quibor.lat, CITY_CENTERS.quibor.lng)
    const distToBqto = haversine(originCoords.lat, originCoords.lng, CITY_CENTERS.barquisimeto.lat, CITY_CENTERS.barquisimeto.lng)

    // Si está lejos de Quíbor pero cerca de Barquisimeto
    if (distToQuibor > 10 && distToBqto < 15) {
      if (distanceKm <= 3) return { tariff: QUIBOR_TARIFFS['quibor-centro'], zoneKey: 'bqto-centro', city: 'barquisimeto' }
      if (distanceKm <= 8) return { tariff: BARQUISIMETO_TARIFFS['bqto-barrios'], zoneKey: 'bqto-barrios', city: 'barquisimeto' }
      if (distanceKm <= 15) return { tariff: BARQUISIMETO_TARIFFS['bqto-lejano'], zoneKey: 'bqto-lejano', city: 'barquisimeto' }
      return { tariff: BARQUISIMETO_TARIFFS['bqto-periferia'], zoneKey: 'bqto-periferia', city: 'barquisimeto' }
    }

    // Si está lejos de ambos centros → interciudad
    if (distToQuibor > 5 && distToBqto > 15) {
      if (distanceKm <= 10) return { tariff: INTERCITY_TARIFFS['quibor-pueblo'], zoneKey: 'quibor-pueblo', city: 'intercity' }
      return { tariff: INTERCITY_TARIFFS['quibor-bqto'], zoneKey: 'quibor-bqto', city: 'intercity' }
    }

    // Cerca de Quíbor
    if (distToQuibor <= 10) {
      if (distanceKm <= 2) return { tariff: QUIBOR_TARIFFS['quibor-centro'], zoneKey: 'quibor-centro', city: 'quibor' }
      if (distanceKm <= 5) return { tariff: QUIBOR_TARIFFS['quibor-barrios'], zoneKey: 'quibor-barrios', city: 'quibor' }
      return { tariff: QUIBOR_TARIFFS['quibor-rural'], zoneKey: 'quibor-rural', city: 'quibor' }
    }
  }

  // Fallback por distancia
  if (distanceKm <= 3) return { tariff: QUIBOR_TARIFFS['quibor-centro'], zoneKey: 'quibor-centro', city: 'quibor' }
  if (distanceKm <= 6) return { tariff: QUIBOR_TARIFFS['quibor-barrios'], zoneKey: 'quibor-barrios', city: 'quibor' }
  if (distanceKm <= 12) return { tariff: QUIBOR_TARIFFS['quibor-rural'], zoneKey: 'quibor-rural', city: 'quibor' }
  if (distanceKm <= 25) return { tariff: INTERCITY_TARIFFS['quibor-bqto'], zoneKey: 'quibor-bqto', city: 'intercity' }
  return { tariff: INTERCITY_TARIFFS['bqto-ciudad'], zoneKey: 'bqto-ciudad', city: 'intercity' }
}

function getTariffSet(city: string): Record<string, TariffConfig> {
  switch (city) {
    case 'quibor': return QUIBOR_TARIFFS
    case 'barquisimeto': return BARQUISIMETO_TARIFFS
    default: return INTERCITY_TARIFFS
  }
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

export async function calculateFare(
  origin: Coordinates,
  destination: Coordinates,
  distanceKm: number,
  durationMinutes: number,
  originAddress: string = '',
  destAddress: string = '',
  vehicleType: string = 'moto'
): Promise<FareCalculation> {
  const night = isNightTime()
  const rush = isRushHour()

  // Detectar zona y tarifa
  const { tariff, zoneKey, city } = detectZone(
    originAddress, destAddress, distanceKm, origin, destination
  )

  // Calcular tarifa base
  let fare = tariff.baseFare

  // Agregar costo por distancia
  fare += distanceKm * tariff.pricePerKm

  // Agregar costo por tiempo
  fare += durationMinutes * tariff.pricePerMin

  // Multiplicador de vehículo (carro es más caro)
  const vehicleMultiplier = vehicleType === 'car' ? 1.5 : 1.0
  fare *= vehicleMultiplier

  // Recargo nocturno
  if (night) {
    fare += tariff.nightSurcharge * vehicleMultiplier
  }

  // Recargo hora pico
  if (rush && !night) {
    fare += tariff.rushSurcharge * vehicleMultiplier
  }

  // Aplicar mínimo y máximo
  fare = Math.max(fare, tariff.minimumFare * vehicleMultiplier)
  fare = Math.min(fare, tariff.maximumFare * vehicleMultiplier)

  // Redondear al múltiplo de $0.25 más cercano
  fare = Math.round(fare * 4) / 4

  // Asegurar mínimo absoluto
  fare = Math.max(fare, 0.50)

  return {
    baseFare: tariff.baseFare,
    distanceFare: distanceKm * tariff.pricePerKm,
    timeFare: durationMinutes * tariff.pricePerMin,
    zoneMultiplier: vehicleMultiplier,
    demandMultiplier: rush ? 1.0 : 1.0,
    nightMultiplier: night ? (tariff.nightSurcharge / tariff.baseFare) + 1 : 1.0,
    discount: 0,
    total: Math.round(fare * 100) / 100,
    minimum: tariff.minimumFare,
  }
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversine(lat1, lng1, lat2, lng2)
}

export function calculateEta(distanceKm: number, avgSpeedKmH: number = 25): number {
  return Math.ceil((distanceKm / avgSpeedKmH) * 60)
}

// Función para obtener el nombre de la zona legible
export function getZoneName(zoneKey: string): string {
  const names: Record<string, string> = {
    'quibor-centro': 'Centro de Quíbor',
    'quibor-barrios': 'Barrios de Quíbor',
    'quibor-rural': 'Zona rural Quíbor',
    'bqto-centro': 'Centro de Barquisimeto',
    'bqto-barrios': 'Barrios de Barquisimeto',
    'bqto-lejano': 'Zona lejana Barquisimeto',
    'bqto-periferia': 'Periferia Barquisimeto',
    'quibor-bqto': 'Quíbor ↔ Barquisimeto',
    'quibor-pueblo': 'Quíbor ↔ Pueblo cercano',
    'bqto-ciudad': 'Barquisimeto ↔ Otra ciudad',
  }
  return names[zoneKey] || 'Zona desconocida'
}
