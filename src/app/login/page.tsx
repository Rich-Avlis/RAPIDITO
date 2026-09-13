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
      await login(formData.phone, formData.password)
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
            <Input
              label="Teléfono"
              type="tel"
              placeholder="+58 412 1234567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              error={errors.phone}
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="Tu contraseña"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
            />

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
