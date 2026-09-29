// Mini CDP driver: evalúa JS en el WebView de la app (debug build).
// Uso: node scripts/cdp.mjs 'document.title'
import WebSocket from 'ws'
import http from 'http'

function getTargets () {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json', (res) => {
      let d = ''
      res.on('data', (c) => { d += c })
      res.on('end', () => resolve(JSON.parse(d)))
    }).on('error', reject)
  })
}

const targets = await getTargets()
const page = targets.find((t) => t.type === 'page')
if (!page) {
  console.error('No page target')
  process.exit(1)
}

const ws = new WebSocket(page.webSocketDebuggerUrl)
let id = 0
const pending = new Map()

function send (method, params = {}) {
  return new Promise((resolve, reject) => {
    const mid = ++id
    pending.set(mid, { resolve, reject })
    ws.send(JSON.stringify({ id: mid, method, params }))
  })
}

ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString())
  if (msg.id && pending.has(msg.id)) {
    const p = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) p.reject(new Error(msg.error.message))
    else p.resolve(msg.result)
  }
})

await new Promise((resolve) => ws.on('open', resolve))

const expression = process.argv[2] || 'document.title'
const res = await send('Runtime.evaluate', {
  expression,
  awaitPromise: true,
  returnByValue: true,
})
if (res.exceptionDetails) {
  console.error('EXCEPTION:', JSON.stringify(res.exceptionDetails, null, 2))
  process.exit(1)
}
console.log(typeof res.result?.value === 'string' ? res.result.value : JSON.stringify(res.result?.value, null, 2))
ws.close()
process.exit(0)
