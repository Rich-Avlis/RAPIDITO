import type { FareCalculation, Coordinates } from '@/types'

// =============================================
// TABULADOR DE TARIFAS RAPIDITO — datos reales 2026
// Quíbor y alrededores, Lara (precios USD)
// Validado con tarifas locales (moto-taxi)
// =============================================

interface TariffConfig {
  baseFare: number
  pricePerKm: number
  pricePerMin: number
  nightSurcharge: number     // Recargo nocturno 8pm–4am
  minimumFare: number
  maximumFare: number
}

// Multiplicadores por tipo de servicio
// Referencia real (Bqto): moto $3.07 / económico $4.88 / confort $6.25 / mascotas $5.66
export const VEHICLE_MULTIPLIERS: Record<string, number> = {
  moto: 1.0,   // 1 persona
  car: 1.6,    // carrito 3 puestos
  chill: 2.0,  // carrito chill 5 puestos
  pets: 1.85,  // mascotas (3)
}

// =============================================
// TABULADOR POR ZONA - QUÍBOR (rutas cortas $1–$2)
// =============================================
const QUIBOR_TARIFFS: Record<string, TariffConfig> = {
  // Centro de Quíbor (0–2 km) — $1.00 plano
  'quibor-centro': {
    baseFare: 1.00,
    pricePerKm: 0.00,
    pricePerMin: 0.00,
    nightSurcharge: 0.25,
    minimumFare: 1.00,
    maximumFare: 1.00,
  },
  // Barrios de Quíbor (2–6 km) — $1–$2
  'quibor-barrios': {
    baseFare: 1.00,
    pricePerKm: 0.10,
    pricePerMin: 0.00,
    nightSurcharge: 0.25,
    minimumFare: 1.00,
    maximumFare: 2.00,
  },
  // Zona rural/campo Quíbor (6+ km dentro del municipio)
  'quibor-rural': {
    baseFare: 1.50,
    pricePerKm: 0.10,
    pricePerMin: 0.00,
    nightSurcharge: 0.50,
    minimumFare: 1.50,
    maximumFare: 3.00,
  },
}

// =============================================
// TABULADOR POR ZONA - BARQUISIMETO
// =============================================
const BARQUISIMETO_TARIFFS: Record<string, TariffConfig> = {
  // Centro de Barquisimeto (0–3 km)
  'bqto-centro': {
    baseFare: 2.00,
    pricePerKm: 0.15,
    pricePerMin: 0.00,
    nightSurcharge: 0.50,
    minimumFare: 2.00,
    maximumFare: 3.50,
  },
  // Barrios de Barquisimeto (3–8 km)
  'bqto-barrios': {
    baseFare: 2.00,
    pricePerKm: 0.20,
    pricePerMin: 0.00,
    nightSurcharge: 0.50,
    minimumFare: 2.00,
    maximumFare: 4.50,
  },
  // Zonas lejanas Bqto (8–15 km)
  'bqto-lejano': {
    baseFare: 3.00,
    pricePerKm: 0.25,
    pricePerMin: 0.00,
    nightSurcharge: 0.75,
    minimumFare: 3.00,
    maximumFare: 6.00,
  },
  // Periferia Bqto (15+ km)
  'bqto-periferia': {
    baseFare: 4.00,
    pricePerKm: 0.30,
    pricePerMin: 0.00,
    nightSurcharge: 1.00,
    minimumFare: 4.00,
    maximumFare: 8.00,
  },
}

// =============================================
// TABULADOR INTERCIUDAD (desde Quíbor)
// =============================================
const INTERCITY_TARIFFS: Record<string, TariffConfig> = {
  // Quíbor ↔ Barquisimeto — $5–$8
  'quibor-bqto': {
    baseFare: 5.00,
    pricePerKm: 0.06,
    pricePerMin: 0.00,
    nightSurcharge: 1.00,
    minimumFare: 5.00,
    maximumFare: 8.00,
  },
  // Quíbor ↔ Tocuyo — $6–$8
  'quibor-tocuyo': {
    baseFare: 6.00,
    pricePerKm: 0.04,
    pricePerMin: 0.00,
    nightSurcharge: 1.00,
    minimumFare: 6.00,
    maximumFare: 8.00,
  },
  // Quíbor ↔ Carora — $8–$12
  'quibor-carora': {
    baseFare: 8.00,
    pricePerKm: 0.05,
    pricePerMin: 0.00,
    nightSurcharge: 1.50,
    minimumFare: 8.00,
    maximumFare: 12.00,
  },
  // Quíbor ↔ Sanare — $8–$12
  'quibor-sanare': {
    baseFare: 8.00,
    pricePerKm: 0.06,
    pricePerMin: 0.00,
    nightSurcharge: 1.50,
    minimumFare: 8.00,
    maximumFare: 12.00,
  },
  // Quíbor ↔ Siquisique — $20–$30
  'quibor-siquisique': {
    baseFare: 20.00,
    pricePerKm: 0.10,
    pricePerMin: 0.00,
    nightSurcharge: 3.00,
    minimumFare: 20.00,
    maximumFare: 30.00,
  },
  // Barquisimeto ↔ otras ciudades (genérico)
  'bqto-ciudad': {
    baseFare: 8.00,
    pricePerKm: 0.15,
    pricePerMin: 0.00,
    nightSurcharge: 1.50,
    minimumFare: 8.00,
    maximumFare: 40.00,
  },
}

// =============================================
// LUGARES CONOCIDOS → ZONA
// (claves sin acentos, en minúsculas; se comparan sin acentos)
// Orden importa: "plaza bolivar" antes que "el bolivar"
// =============================================
const KNOWN_PLACES: Record<string, { zone: string; city: string }> = {
  // === QUÍBOR CENTRO ===
  'plaza bolivar': { zone: 'quibor-centro', city: 'quibor' },
  'centro quibor': { zone: 'quibor-centro', city: 'quibor' },
  'centro historico': { zone: 'quibor-centro', city: 'quibor' },
  'iglesia': { zone: 'quibor-centro', city: 'quibor' },
  'mercado': { zone: 'quibor-centro', city: 'quibor' },
  'casa de la cultura': { zone: 'quibor-centro', city: 'quibor' },
  'municipio': { zone: 'quibor-centro', city: 'quibor' },
  'terminal': { zone: 'quibor-centro', city: 'quibor' },

  // === QUÍBOR BARRIOS (lista real) ===
  'la piolin': { zone: 'quibor-barrios', city: 'quibor' },
  'piolin': { zone: 'quibor-barrios', city: 'quibor' },
  'cabo jose dorante': { zone: 'quibor-barrios', city: 'quibor' },
  'dorante': { zone: 'quibor-barrios', city: 'quibor' },
  'el estadio': { zone: 'quibor-barrios', city: 'quibor' },
  'estadio': { zone: 'quibor-barrios', city: 'quibor' },
  'la guaroa': { zone: 'quibor-barrios', city: 'quibor' },
  'guaroa': { zone: 'quibor-barrios', city: 'quibor' },
  '1er de mayo': { zone: 'quibor-barrios', city: 'quibor' },
  '1 de mayo': { zone: 'quibor-barrios', city: 'quibor' },
  'primer de mayo': { zone: 'quibor-barrios', city: 'quibor' },
  'el bolivar': { zone: 'quibor-barrios', city: 'quibor' },
  'jacinto lara': { zone: 'quibor-barrios', city: 'quibor' },
  'villa guadalupe': { zone: 'quibor-barrios', city: 'quibor' },
  'don flores': { zone: 'quibor-barrios', city: 'quibor' },
  'los ortices': { zone: 'quibor-barrios', city: 'quibor' },
  'ortices': { zone: 'quibor-barrios', city: 'quibor' },
  'la tinaja': { zone: 'quibor-barrios', city: 'quibor' },
  'la rotaria': { zone: 'quibor-barrios', city: 'quibor' },
  'rotaria': { zone: 'quibor-barrios', city: 'quibor' },
  'la palma': { zone: 'quibor-barrios', city: 'quibor' },
  'la ermita': { zone: 'quibor-barrios', city: 'quibor' },
  'ermita': { zone: 'quibor-barrios', city: 'quibor' },
  'pepe coloma': { zone: 'quibor-barrios', city: 'quibor' },
  'la quiborena': { zone: 'quibor-barrios', city: 'quibor' },
  'quiborena': { zone: 'quibor-barrios', city: 'quibor' },

  // === QUÍBOR ZONA RURAL ===
  'el cuara': { zone: 'quibor-rural', city: 'quibor' },
  'tambor': { zone: 'quibor-rural', city: 'quibor' },

  // === BARQUISIMETO CENTRO ===
  'centro barquisimeto': { zone: 'bqto-centro', city: 'barquisimeto' },
  'centro historico barquisimeto': { zone: 'bqto-centro', city: 'barquisimeto' },
  'ob barquisimeto': { zone: 'bqto-centro', city: 'barquisimeto' },
  'avenida brazil': { zone: 'bqto-centro', city: 'barquisimeto' },
  'avenida ferrero': { zone: 'bqto-centro', city: 'barquisimeto' },
  'catedral': { zone: 'bqto-centro', city: 'barquisimeto' },
  'polideportivo': { zone: 'bqto-centro', city: 'barquisimeto' },
  'obelisco': { zone: 'bqto-centro', city: 'barquisimeto' },
  'plaza venezuela': { zone: 'bqto-centro', city: 'barquisimeto' },
  'altamira': { zone: 'bqto-centro', city: 'barquisimeto' },
  'sambil': { zone: 'bqto-barrios', city: 'barquisimeto' },
  'metropolis': { zone: 'bqto-barrios', city: 'barquisimeto' },

  // === BARQUISIMETO BARRIOS ===
  'las mercedes': { zone: 'bqto-barrios', city: 'barquisimeto' },
  'la concordia': { zone: 'bqto-barrios', city: 'barquisimeto' },
  'san jacinto': { zone: 'bqto-barrios', city: 'barquisimeto' },
  'el sucre': { zone: 'bqto-barrios', city: 'barquisimeto' },
  'cuatricentenario': { zone: 'bqto-barrios', city: 'barquisimeto' },
  'los trinitarios': { zone: 'bqto-barrios', city: 'barquisimeto' },
  'santa rita': { zone: 'bqto-barrios', city: 'barquisimeto' },
  '2000': { zone: 'bqto-barrios', city: 'barquisimeto' },
  'quisquiri': { zone: 'bqto-barrios', city: 'barquisimeto' },
  'anibaro': { zone: 'bqto-barrios', city: 'barquisimeto' },
  'guache': { zone: 'bqto-barrios', city: 'barquisimeto' },

  // === BARQUISIMETO ZONA LEJANA ===
  'tacao': { zone: 'bqto-lejano', city: 'barquisimeto' },
  'anzoategui': { zone: 'bqto-lejano', city: 'barquisimeto' },
  'tamaca': { zone: 'bqto-lejano', city: 'barquisimeto' },
}

// === CIUDADES INTERCIUDAD (siempre se evalúan primero) ===
const INTERTOWN_PLACES: Record<string, { zone: string; city: string }> = {
  'siquisique': { zone: 'quibor-siquisique', city: 'intercity' },
  'carora': { zone: 'quibor-carora', city: 'intercity' },
  'el tocuyo': { zone: 'quibor-tocuyo', city: 'intercity' },
  'tocuyo': { zone: 'quibor-tocuyo', city: 'intercity' },
  'sanare': { zone: 'quibor-sanare', city: 'intercity' },
  'cabudare': { zone: 'quibor-bqto', city: 'intercity' },
}

// Coordenadas de referencia (verificadas)
const CITY_CENTERS: Record<string, Coordinates> = {
  quibor: { lat: 9.93, lng: -69.62 },
  barquisimeto: { lat: 10.0647, lng: -69.3570 },
  carora: { lat: 10.1734, lng: -70.0762 },
  tocuyo: { lat: 9.7833, lng: -69.2667 },
}

// Recargo nocturno: 8pm–4am (definido por tarifas locales)
export function isNightTime(now: Date = new Date()): boolean {
  const hour = now.getHours()
  return hour >= 20 || hour < 4
}

function strip(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function detectZone(
  originName: string,
  destName: string,
  distanceKm: number,
  originCoords?: Coordinates,
  destCoords?: Coordinates
): { tariff: TariffConfig; zoneKey: string; city: string } {
  const lowerOrigin = strip(originName)
  const lowerDest = strip(destName)

  // 0. Pueblos interciudad → siempre primero (antes de zonas por distancia)
  for (const [key, value] of Object.entries(INTERTOWN_PLACES)) {
    if (lowerDest.includes(key) || lowerOrigin.includes(key)) {
      const tariffSet = getTariffSet(value.city)
      return { tariff: tariffSet[value.zone], zoneKey: value.zone, city: value.city }
    }
  }

  // 1. Viaje largo sin pueblo identificado → interciudad genérico
  //    (evita que "Quíbor → Sambil Barquisimeto" caiga en zona intra-Bqto)
  if (distanceKm > 18) {
    if (distanceKm <= 45) return { tariff: INTERCITY_TARIFFS['quibor-bqto'], zoneKey: 'quibor-bqto', city: 'intercity' }
    return { tariff: INTERCITY_TARIFFS['bqto-ciudad'], zoneKey: 'bqto-ciudad', city: 'intercity' }
  }

  // 2. Buscar destino en lugares conocidos
  for (const [key, value] of Object.entries(KNOWN_PLACES)) {
    if (lowerDest.includes(key)) {
      const tariffSet = getTariffSet(value.city)
      return { tariff: tariffSet[value.zone], zoneKey: value.zone, city: value.city }
    }
  }

  // 3. Buscar origen en lugares conocidos
  for (const [key, value] of Object.entries(KNOWN_PLACES)) {
    if (lowerOrigin.includes(key)) {
      const tariffSet = getTariffSet(value.city)
      return { tariff: tariffSet[value.zone], zoneKey: value.zone, city: value.city }
    }
  }

  // 4. Detectar por ciudad usando coordenadas
  if (originCoords && destCoords) {
    const distToQuibor = haversine(originCoords.lat, originCoords.lng, CITY_CENTERS.quibor.lat, CITY_CENTERS.quibor.lng)
    const distToBqto = haversine(originCoords.lat, originCoords.lng, CITY_CENTERS.barquisimeto.lat, CITY_CENTERS.barquisimeto.lng)

    // Viaje corto → ciudad más cercana al origen, zona por distancia del viaje
    if (distToBqto < distToQuibor) {
      if (distanceKm <= 3) return { tariff: BARQUISIMETO_TARIFFS['bqto-centro'], zoneKey: 'bqto-centro', city: 'barquisimeto' }
      if (distanceKm <= 8) return { tariff: BARQUISIMETO_TARIFFS['bqto-barrios'], zoneKey: 'bqto-barrios', city: 'barquisimeto' }
      if (distanceKm <= 15) return { tariff: BARQUISIMETO_TARIFFS['bqto-lejano'], zoneKey: 'bqto-lejano', city: 'barquisimeto' }
      return { tariff: BARQUISIMETO_TARIFFS['bqto-periferia'], zoneKey: 'bqto-periferia', city: 'barquisimeto' }
    }

    if (distanceKm <= 2) return { tariff: QUIBOR_TARIFFS['quibor-centro'], zoneKey: 'quibor-centro', city: 'quibor' }
    if (distanceKm <= 6) return { tariff: QUIBOR_TARIFFS['quibor-barrios'], zoneKey: 'quibor-barrios', city: 'quibor' }
    return { tariff: QUIBOR_TARIFFS['quibor-rural'], zoneKey: 'quibor-rural', city: 'quibor' }
  }

  // Fallback por distancia
  if (distanceKm <= 2) return { tariff: QUIBOR_TARIFFS['quibor-centro'], zoneKey: 'quibor-centro', city: 'quibor' }
  if (distanceKm <= 6) return { tariff: QUIBOR_TARIFFS['quibor-barrios'], zoneKey: 'quibor-barrios', city: 'quibor' }
  if (distanceKm <= 12) return { tariff: QUIBOR_TARIFFS['quibor-rural'], zoneKey: 'quibor-rural', city: 'quibor' }
  if (distanceKm <= 45) return { tariff: INTERCITY_TARIFFS['quibor-bqto'], zoneKey: 'quibor-bqto', city: 'intercity' }
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

  // Detectar zona y tarifa
  const { tariff } = detectZone(
    originAddress, destAddress, distanceKm, origin, destination
  )

  // Multiplicador por tipo de servicio
  const vehicleMultiplier = VEHICLE_MULTIPLIERS[vehicleType] ?? VEHICLE_MULTIPLIERS.moto

  // Tarifa base + distancia + tiempo
  let fare = tariff.baseFare
  fare += distanceKm * tariff.pricePerKm
  fare += durationMinutes * tariff.pricePerMin
  fare *= vehicleMultiplier

  // Tope máximo (por zona)
  fare = Math.min(fare, tariff.maximumFare * vehicleMultiplier)

  // Recargo nocturno 8pm–4am (va encima del tope)
  if (night) {
    fare += tariff.nightSurcharge * vehicleMultiplier
  }

  // Redondear hacia abajo al múltiplo de $0.25 (precio "limpio")
  fare = Math.floor(fare * 4) / 4

  // Mínimo por zona
  fare = Math.max(fare, tariff.minimumFare * vehicleMultiplier)

  // Mínimo absoluto
  fare = Math.max(fare, 0.50)

  return {
    baseFare: tariff.baseFare,
    distanceFare: distanceKm * tariff.pricePerKm,
    timeFare: durationMinutes * tariff.pricePerMin,
    zoneMultiplier: vehicleMultiplier,
    demandMultiplier: 1.0,
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
    'quibor-tocuyo': 'Quíbor ↔ Tocuyo',
    'quibor-carora': 'Quíbor ↔ Carora',
    'quibor-sanare': 'Quíbor ↔ Sanare',
    'quibor-siquisique': 'Quíbor ↔ Siquisique',
    'bqto-ciudad': 'Barquisimeto ↔ Otra ciudad',
  }
  return names[zoneKey] || 'Zona desconocida'
}
