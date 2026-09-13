'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const PHONE_CODES = ['414', '424', '426', '416', '412', '422']

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRole = searchParams.get('role') || 'PASSENGER'

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneCode: '414',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: initialRole as 'PASSENGER' | 'DRIVER',
    // Vehicle fields (only for drivers)
    vehicleType: 'moto',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleColor: '',
    vehiclePlate: '',
    vehicleYear: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const fullPhone = `+58${formData.phoneCode}${formData.phoneNumber}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError('')
    setErrors({})

    const newErrors: Record<string, string> = {}
    if (!formData.firstName) newErrors.firstName = 'Nombre requerido'
    if (!formData.lastName) newErrors.lastName = 'Apellido requerido'
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Número requerido'
    if (formData.phoneNumber.length !== 7) newErrors.phoneNumber = 'Debe tener 7 dígitos'
    if (!formData.email) newErrors.email = 'Correo requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Correo inválido'
    if (formData.password.length < 8) newErrors.password = 'Mínimo 8 caracteres'
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    if (formData.role === 'DRIVER') {
      if (!formData.vehicleBrand) newErrors.vehicleBrand = 'Marca requerida'
      if (!formData.vehicleModel) newErrors.vehicleModel = 'Modelo requerido'
      if (!formData.vehicleColor) newErrors.vehicleColor = 'Color requerido'
      if (!formData.vehiclePlate) newErrors.vehiclePlate = 'Placa requerida'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: fullPhone,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          vehicle: formData.role === 'DRIVER' ? {
            type: formData.vehicleType,
            brand: formData.vehicleBrand,
            model: formData.vehicleModel,
            color: formData.vehicleColor,
            plateNumber: formData.vehiclePlate,
            year: formData.vehicleYear ? parseInt(formData.vehicleYear) : undefined,
          } : undefined,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setApiError(data.error || 'Error al registrar')
        return
      }

      // Save phone for OTP verification
      localStorage.setItem('rapidito_phone', fullPhone)

      if (formData.role === 'DRIVER') {
        router.push('/driver/complete-profile')
      } else {
        router.push('/verify-otp')
      }
    } catch (error) {
      setApiError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const inputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [field]: e.target.value })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/10 px-4 py-12">
      <div className="fixed top-20 left-10 text-6xl opacity-5">🏍️</div>
      <div className="fixed bottom-20 right-10 text-5xl opacity-5">🚗</div>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white font-bold text-2xl shadow-lg shadow-primary/30">
            R
          </div>
          <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
          <CardDescription>
            {formData.role === 'PASSENGER'
              ? 'Regístrate para solicitar viajes'
              : 'Regístrate para conducir en RAPIDITO'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.role === 'PASSENGER' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setFormData({ ...formData, role: 'PASSENGER' })}
              >
                🚗 Pasajero
              </Button>
              <Button
                type="button"
                variant={formData.role === 'DRIVER' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setFormData({ ...formData, role: 'DRIVER' })}
              >
                🏍️ Conductor
              </Button>
            </div>

            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre"
                placeholder="Tu nombre"
                value={formData.firstName}
                onChange={inputChange('firstName')}
                error={errors.firstName}
              />
              <Input
                label="Apellido"
                placeholder="Tu apellido"
                value={formData.lastName}
                onChange={inputChange('lastName')}
                error={errors.lastName}
              />
            </div>

            {/* Phone with carrier code */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Teléfono</label>
              <div className="flex gap-2">
                <div className="flex items-center rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-600">
                  +58
                </div>
                <select
                  value={formData.phoneCode}
                  onChange={inputChange('phoneCode')}
                  className="h-10 w-20 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {PHONE_CODES.map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="1234567"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 7)
                    setFormData({ ...formData, phoneNumber: val })
                  }}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-sm text-red-500">{errors.phoneNumber}</p>
              )}
            </div>

            {/* Email - Required */}
            <Input
              label="Correo electrónico *"
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={inputChange('email')}
              error={errors.email}
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={formData.password}
              onChange={inputChange('password')}
              error={errors.password}
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="Repite tu contraseña"
              value={formData.confirmPassword}
              onChange={inputChange('confirmPassword')}
              error={errors.confirmPassword}
            />

            {/* Driver Vehicle Section */}
            {formData.role === 'DRIVER' && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  🏍️ Información del Vehículo
                </h3>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Tipo de vehículo</label>
                    <select
                      value={formData.vehicleType}
                      onChange={inputChange('vehicleType')}
                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="moto">🏍️ Moto</option>
                      <option value="car">🚗 Automóvil</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Marca"
                      placeholder="Honda, Toyota..."
                      value={formData.vehicleBrand}
                      onChange={inputChange('vehicleBrand')}
                      error={errors.vehicleBrand}
                    />
                    <Input
                      label="Modelo"
                      placeholder="XR, Corolla..."
                      value={formData.vehicleModel}
                      onChange={inputChange('vehicleModel')}
                      error={errors.vehicleModel}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Color"
                      placeholder="Negro, Rojo..."
                      value={formData.vehicleColor}
                      onChange={inputChange('vehicleColor')}
                      error={errors.vehicleColor}
                    />
                    <Input
                      label="Placa"
                      placeholder="ABC123"
                      value={formData.vehiclePlate}
                      onChange={inputChange('vehiclePlate')}
                      error={errors.vehiclePlate}
                    />
                  </div>

                  <Input
                    label="Año (opcional)"
                    type="number"
                    placeholder="2020"
                    value={formData.vehicleYear}
                    onChange={inputChange('vehicleYear')}
                  />
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  📋 Después del registro completarás la documentación del vehículo.
                </p>
              </div>
            )}

            {apiError && (
              <p className="text-sm text-red-500 text-center">{apiError}</p>
            )}

            <Button
              type="submit"
              className="w-full shadow-lg shadow-primary/30"
              size="lg"
              isLoading={isLoading}
            >
              Crear Cuenta
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Iniciar Sesión
            </Link>
          </p>
        </CardContent>
      </Card>

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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Cargando...</div>}>
      <RegisterForm />
    </Suspense>
  )
}
