'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function VerifyOtpPage() {
  const router = useRouter()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('El código debe tener 6 dígitos')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Get phone from localStorage (saved during registration)
      const phone = localStorage.getItem('rapidito_phone')

      if (!phone) {
        setError('No se encontró el teléfono. Inicia sesión nuevamente.')
        return
      }

      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          code: otp,
          purpose: 'registration',
        }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.removeItem('rapidito_phone')
        setSuccess(true)
        setTimeout(() => {
          router.push('/passenger')
        }, 1500)
      } else {
        setError(data.error || 'Código inválido')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/passenger')
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/10">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900">¡Verificado!</h2>
            <p className="mt-2 text-gray-600">Redirigiendo al panel...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/10 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
            📱
          </div>
          <CardTitle className="text-2xl">Verifica tu teléfono</CardTitle>
          <CardDescription>
            Te enviamos un código de 6 dígitos a tu número
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Código de verificación
            </label>
            <Input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-2xl tracking-[0.5em]"
              maxLength={6}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleVerify}
            isLoading={isLoading}
            disabled={otp.length !== 6}
          >
            Verificar
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">
              ¿No recibiste el código?
            </p>
            <button
              type="button"
              className="text-sm text-primary font-medium hover:underline"
              onClick={() => {}}
            >
              Reenviar código
            </button>
          </div>

          <div className="border-t pt-4">
            <button
              type="button"
              className="w-full text-sm text-gray-500 hover:text-gray-700"
              onClick={handleSkip}
            >
              Omitir por ahora →
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}