import { calculateFare, calculateDistance } from '../src/services/fare'

async function trip(
  name: string,
  o: [number, number],
  d: [number, number],
  oAddr: string,
  dAddr: string
) {
  const dist = calculateDistance(o[0], o[1], d[0], d[1])
  const dur = Math.ceil((dist / 25) * 60)
  const f = await calculateFare({ lat: o[0], lng: o[1] }, { lat: d[0], lng: d[1] }, dist, dur, oAddr, dAddr, 'moto')
  console.log(`${name}: ${dist.toFixed(1)}km / ${dur}min → $${f.total.toFixed(2)} (mín $${f.minimum.toFixed(2)})`)
}

// Quíbor coords
const Q = [9.93, -69.62] as [number, number]
const B = [10.0647, -69.357] as [number, number]

async function main() {
await trip('Quíbor centro→barrio (nombres)', Q, [9.94, -69.61], 'Plaza Bolívar Quíbor', 'Jacinto Lara Quíbor')
await trip('Quíbor dentro del centro', Q, [9.934, -69.625], 'Plaza Bolívar', 'Mercado Quíbor')
await trip('Quíbor solo coordenadas 4km', Q, [9.96, -69.60], '', '')
await trip('Quíbor→Barquisimeto', Q, B, '', '')
await trip('Bqto solo coordenadas 4km', B, [10.075, -69.37], '', '')
await trip('Barquisimeto→Quíbor (rev)', B, Q, '', '')
await trip('Quíbor→Carora (~40km)', Q, [10.1734, -70.0762], '', '')
}

main()
