'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'
import FluidOrb from '@/components/ui/fluid-orb'

export default function LoginPage() {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [roleChoice, setRoleChoice] = useState<'PASSENGER' | 'DRIVER' | null>(null)
  const [pendingUser, setPendingUser] = useState<any>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  // Animated map background with Lara icons
  useEffect(() => {
    if (!mapRef.current) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    mapRef.current.appendChild(canvas)
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    let offset = 0
    const speed = 0.3

    const drawMap = () => {
      // Background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#FFF7ED')
      gradient.addColorStop(1, '#FFEDD5')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid lines (calles)
      ctx.strokeStyle = '#FED7AA'
      ctx.lineWidth = 1

      // Vertical lines
      for (let x = -100 + (offset % 80); x < canvas.width + 100; x += 80) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      // Horizontal lines
      for (let y = -100 + (offset % 80); y < canvas.height + 100; y += 80) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Main streets (naranjas)
      ctx.strokeStyle = '#FB923C'
      ctx.lineWidth = 3
      for (let x = -200 + (offset % 200); x < canvas.width + 200; x += 200) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = -200 + (offset % 200); y < canvas.height + 200; y += 200) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw blocks
      ctx.fillStyle = '#FED7AA'
      for (let x = -100 + (offset % 80); x < canvas.width + 100; x += 80) {
        for (let y = -100 + (offset % 80); y < canvas.height + 100; y += 80) {
          if ((Math.floor(x / 80) + Math.floor(y / 80)) % 3 === 0) {
            ctx.fillRect(x + 5, y + 5, 30, 30)
          }
        }
      }

      // Moving dots (motos/carros)
      ctx.fillStyle = '#FF6B00'
      const time = Date.now() / 1000
      for (let i = 0; i < 8; i++) {
        const x = (Math.sin(time * 0.5 + i * 2) * 0.5 + 0.5) * canvas.width
        const y = (Math.cos(time * 0.3 + i * 1.5) * 0.5 + 0.5) * canvas.height
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw Obelisco silhouette (simplified)
      ctx.fillStyle = '#FB923C'
      ctx.globalAlpha = 0.15
      const obX = canvas.width * 0.15
      const obY = canvas.height * 0.3
      ctx.beginPath()
      ctx.moveTo(obX, obY + 80)
      ctx.lineTo(obX + 10, obY)
      ctx.lineTo(obX + 20, obY + 80)
      ctx.closePath()
      ctx.fill()

      // Draw Tinaja silhouette (simplified)
      const tjX = canvas.width * 0.85
      const tjY = canvas.height * 0.7
      ctx.beginPath()
      ctx.arc(tjX, tjY, 30, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(tjX + 20, tjY - 10, 25, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1.0

      // Central pin
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      ctx.fillStyle = '#FF6B00'
      ctx.beginPath()
      ctx.arc(centerX, centerY - 10, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(centerX, centerY - 10, 5, 0, Math.PI * 2)
      ctx.fill()

      offset += speed
      animationRef.current = requestAnimationFrame(drawMap)
    }

    drawMap()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      canvas.remove()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setApiError('')
    setErrors({})

    const newErrors: Record<string, string> = {}
    if (!formData.phone) newErrors.phone = 'Teléfono requerido'
    if (!formData.password) newErrors.password = 'Contraseña requerida'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      await login('+58' + formData.phone, formData.password)
    } catch (error: any) {
      setApiError(error.message || 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleSelect = async (role: 'PASSENGER' | 'DRIVER') => {
    setRoleChoice(role)
    try {
      const res = await fetch('/api/auth/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = await res.json()
      if (data.success) {
        window.location.href = role === 'DRIVER' ? '/driver' : '/passenger'
      }
    } catch {
      window.location.href = role === 'DRIVER' ? '/driver' : '/passenger'
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Map Background */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* FluidOrb decorations */}
      <div className="absolute -top-24 -right-24 z-[1] opacity-30 pointer-events-none">
        <FluidOrb size={300} color="#FF6B00" />
      </div>
      <div className="absolute -bottom-32 -left-32 z-[1] opacity-20 pointer-events-none">
        <FluidOrb size={380} color="#E55D00" />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/80 via-white/60 to-white/80" />

      {/* Login Card */}
      <div className="relative z-20 w-full max-w-md mx-4">
        <div className="glass-strong rounded-3xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF6B00] text-white font-bold text-3xl shadow-lg shadow-[#FF6B00]/30">
              R
            </div>
            <h1 className="text-3xl font-bold text-gray-900">RAPIDITO</h1>
            <p className="text-[#FF6B00] font-medium mt-1">Pa' donde vas</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Teléfono</label>
              <div className="flex">
                <span className="flex items-center rounded-l-xl border border-r-0 border-white/30 glass-subtle px-4 py-3 text-sm text-gray-600 font-medium">
                  +58
                </span>
                <input
                  type="tel"
                  placeholder="412 1234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                  className="flex-1 rounded-r-xl glass-input px-4 py-3 text-sm focus:outline-none"
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-xl glass-input px-4 py-3 pr-12 text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            {apiError && (
              <p className="text-sm text-red-500 text-center bg-red-50 p-3 rounded-xl">{apiError}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full glass-btn text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 space-y-4">
            <Link
              href="/forgot-password"
              className="block text-center text-sm text-[#FF6B00] hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-gray-400">o</span>
              </div>
            </div>

            <Link href="/login-otp">
              <button className="w-full glass-card border-[#FF6B00]/30 text-[#FF6B00] py-3 rounded-xl font-bold hover:bg-[#FF6B00]/10 transition-colors cursor-pointer">
                📱 Iniciar sesión con código SMS
              </button>
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-[#FF6B00] font-bold hover:underline">
              Regístrate
            </Link>
          </p>

          {/* Role Selection */}
          {pendingUser && !roleChoice && (
            <div className="mt-6 glass-orange rounded-2xl p-4">
              <p className="text-center text-sm font-bold text-gray-900 mb-3">
                ¿Cómo quieres usar RAPIDITO?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleRoleSelect('PASSENGER')}
                  className="p-4 rounded-xl glass-card text-center"
                >
                  <div className="text-3xl mb-2">🚗</div>
                  <div className="font-bold text-gray-900 text-sm">Pasajero</div>
                  <div className="text-xs text-gray-500 mt-1">Pa' donde vas</div>
                </button>
                <button
                  onClick={() => handleRoleSelect('DRIVER')}
                  className="p-4 rounded-xl glass-card text-center"
                >
                  <div className="text-3xl mb-2">🏍️</div>
                  <div className="font-bold text-gray-900 text-sm">Conductor</div>
                  <div className="text-xs text-gray-500 mt-1">Pa' donde vamos</div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-gray-500">© 2026 RAPIDITO. 100% GUARO 🇻🇪</p>
          <a 
            href="https://asistid.net" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-[#FF6B00] transition-colors"
          >
            Powered by <span className="font-semibold">Asistid</span>
          </a>
        </div>
      </div>
    </div>
  )
}
