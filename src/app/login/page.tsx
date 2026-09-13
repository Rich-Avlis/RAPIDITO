'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/providers/auth-provider'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/10 px-4 py-12">
      {/* Decorative elements */}
      <div className="fixed top-20 left-10 text-6xl opacity-5">🏍️</div>
      <div className="fixed bottom-20 right-10 text-5xl opacity-5">🚗</div>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white font-bold text-2xl shadow-lg shadow-primary/30">
            R
          </div>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Teléfono</label>
              <div className="flex">
                <span className="flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-600 font-medium">
                  +58
                </span>
                <input
                  type="tel"
                  placeholder="412 1234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                  className="flex-1 rounded-r-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
              <p className="text-sm text-red-500 text-center">{apiError}</p>
            )}

            <Button
              type="submit"
              className="w-full shadow-lg shadow-primary/30"
              size="lg"
              isLoading={isLoading}
            >
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <Link
              href="/forgot-password"
              className="block text-center text-sm text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">o</span>
              </div>
            </div>

            <Link href="/login-otp">
              <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5">
                📱 Iniciar sesión con código SMS
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <a 
          href="https://asistid.net" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-primary transition-colors"
        >
          Powered by <span className="font-semibold">Asistid</span>
        </a>
      </div>
    </div>
  )
}
