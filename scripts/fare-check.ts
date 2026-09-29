import { calculateFare, calculateDistance, isNightTime } from '../src/services/fare'

async function trip(
  name: string,
  o: [number, number],
  d: [number, number],
  oAddr: string,
  dAddr: string,
  vehicle = 'moto'
) {
  const dist = calculateDistance(o[0], o[1], d[0], d[1])
  const dur = Math.ceil((dist / 25) * 60)
  const f = await calculateFare({ lat: o[0], lng: o[1] }, { lat: d[0], lng: d[1] }, dist, dur, oAddr, dAddr, vehicle)
  console.log(`${name}: ${dist.toFixed(1)}km / ${dur}min → $${f.total.toFixed(2)} [${vehicle}]`)
}

// Quíbor coords
const Q = [9.93, -69.62] as [number, number]
const B = [10.0647, -69.357] as [number, number]

async function main() {
  console.log(`Recargo nocturno activo: ${isNightTime() ? 'SÍ (8pm-4am)' : 'no (tarifa normal)'}\n`)

  console.log('--- Rutas cortas Quíbor (esperado $1-$2) ---')
  await trip('Plaza→Jacinto Lara', Q, [9.94, -69.61], 'Plaza Bolívar Quíbor', 'Urb. Jacinto Lara Quíbor')
  await trip('Jacinto Lara→La Piolín', [9.94, -69.61], [9.92, -69.63], 'Urb. Jacinto Lara Quíbor', 'La Piolín Quíbor')
  await trip('Centro→Mercado', Q, [9.934, -69.625], 'Plaza Bolívar', 'Mercado Quíbor')
  await trip('Solo coordenadas 4km', Q, [9.96, -69.60], '', '')
  await trip('Solo coordenadas 1.5km', Q, [9.944, -69.62], '', '')

  console.log('\n--- Interciudad (esperado Q↔Bqto $5-$8) ---')
  await trip('Quíbor→Barquisimeto', Q, B, '', '')
  await trip('Barquisimeto→Quíbor (rev)', B, Q, '', '')
  await trip('Quíbor→Bqto (nombres)', Q, B, 'Plaza Bolívar Quíbor', 'Sambil Barquisimeto')

  console.log('\n--- Barquisimeto intra (referencia Sambil→Metrópolis moto ~$3) ---')
  await trip('Bqto 4km coords', B, [10.075, -69.37], '', '')
  await trip('Sambil→Metrópolis', [10.074, -69.337], [10.053, -69.349], 'Sambil Barquisimeto', 'Metrópolis Barquisimeto')

  console.log('\n--- Pueblos (por nombre) ---')
  await trip('Quíbor→Tocuyo', Q, [9.7833, -69.2667], 'Quíbor', 'El Tocuyo')
  await trip('Quíbor→Carora', Q, [10.1734, -70.0762], 'Quíbor', 'Carora')
  await trip('Quíbor→Sanare', Q, [9.68, -69.92], 'Quíbor', 'Sanare')
  await trip('Quíbor→Siquisique', Q, [10.07, -69.67], 'Quíbor', 'Siquisique')

  console.log('\n--- Tipos de vehículo (Q→Bqto) ---')
  for (const v of ['moto', 'car', 'chill', 'pets']) {
    await trip('Q→Bqto', Q, B, '', '', v)
  }
}

main()
