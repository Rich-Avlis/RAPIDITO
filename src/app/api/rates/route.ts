import { NextResponse } from 'next/server'

// Tasa USD→Bs (Banco Central de Venezuela).
// bcv.org.ve no es accesible de forma confiable desde el servidor,
// se usa dolarapi.com (espejo de la tasa oficial BCV).

const TTL_MS = 30 * 60 * 1000 // 30 minutos

let cache: { rate: number; fetchedAt: number } | null = null

async function fetchBcvRate(): Promise<number | null> {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/oficial', {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'RAPIDITO/1.0' },
    })
    if (!res.ok) return null
    const json = await res.json()
    const rate = Number(json?.venta)
    if (Number.isFinite(rate) && rate > 0) return rate
    return null
  } catch {
    return null
  }
}

export async function GET() {
  const fresh = cache && Date.now() - cache.fetchedAt < TTL_MS
  if (fresh && cache) {
    return NextResponse.json({
      success: true,
      data: {
        usdToBs: cache.rate,
        source: 'BCV (oficial)',
        updatedAt: new Date(cache.fetchedAt).toISOString(),
      },
    })
  }

  const rate = await fetchBcvRate()
  if (rate !== null) {
    cache = { rate, fetchedAt: Date.now() }
    return NextResponse.json({
      success: true,
      data: {
        usdToBs: rate,
        source: 'BCV (oficial)',
        updatedAt: new Date(cache.fetchedAt).toISOString(),
      },
    })
  }

  // Sin conexión: servir última tasa conocida si existe
  if (cache) {
    return NextResponse.json({
      success: true,
      data: {
        usdToBs: cache.rate,
        source: 'BCV (oficial, caché)',
        updatedAt: new Date(cache.fetchedAt).toISOString(),
      },
    })
  }

  return NextResponse.json(
    { success: false, error: 'Tasa BCV no disponible' },
    { status: 503 }
  )
}
