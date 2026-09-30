// Bot conductor: acepta viajes abiertos y los lleva hasta COMPLETED.
// Uso: node scripts/driver-bot.mjs   (detener: pkill -f driver-bot)
const BASE = 'https://rapidito-virid.vercel.app'
const PHONE = '+584125203741'
const PASSWORD = '12345678'

let cookie = ''

async function login () {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: PHONE, password: PASSWORD }),
  })
  const setCookie = res.headers.get('set-cookie') || ''
  cookie = setCookie.split(';')[0]
  const data = await res.json()
  console.log(new Date().toISOString(), 'login:', res.status, data.success ? 'OK' : data.error)
}

async function api (path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
      ...(opts.headers || {}),
    },
  })
  if (res.status === 401) {
    await login()
    return api(path, opts)
  }
  return res.json()
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function trip (ride) {
  console.log(new Date().toISOString(), 'viaje encontrado:', ride.id.slice(0, 8), ride.riderName || (ride.passenger?.user?.firstName ?? ''), `$${ride.estimatedFare}`)
  let r = await api(`/api/rides/${ride.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'accept' }) })
  if (!r.success) { console.log('accept falló:', r.error); return }
  console.log('  aceptado ✓')

  await sleep(10000)
  r = await api(`/api/rides/${ride.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'arrive' }) })
  if (!r.success) { console.log('arrive falló:', r.error); return }
  console.log('  llegó al punto ✓')

  await sleep(10000)
  r = await api(`/api/rides/${ride.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'start' }) })
  if (!r.success) { console.log('start falló:', r.error); return }
  console.log('  viaje iniciado ✓')

  await sleep(30000)
  r = await api(`/api/rides/${ride.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'complete' }) })
  console.log('  finalizado:', r.success ? '✓' : r.error)
}

async function main () {
  await login()
  // asegurar conductor en línea
  await api('/api/drivers/status', { method: 'PUT', body: JSON.stringify({ isOnline: true, lat: 9.9290, lng: -69.6190 }) })
  console.log(new Date().toISOString(), 'bot listo, esperando viajes...')

  while (true) {
    try {
      const r = await api('/api/rides?status=SEARCHING_DRIVER&limit=5')
      const open = r.success ? r.data.rides : []
      if (open.length) {
        await trip(open[0])
      }
    } catch (e) {
      console.log('error:', String(e).slice(0, 120))
    }
    await sleep(4000)
  }
}

main()
