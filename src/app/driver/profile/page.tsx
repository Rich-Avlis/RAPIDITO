'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/providers/auth-provider'
import Link from 'next/link'

export default function DriverProfile() {
  const { user, refreshUser } = useAuth()
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    photo: '',
    vehicle: {
      brand: '',
      model: '',
      color: '',
      plateNumber: '',
      year: '',
      type: 'moto',
    },
    license: {
      number: '',
      expiry: '',
    },
    payment: {
      bank: '',
      phone: '',
      cedula: '',
      name: '',
    },
  })
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/drivers/profile')
      const data = await res.json()
      if (data.success) {
        setProfile(data.data)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('La foto no puede ser mayor a 5MB')
      return
    }

    setUploadingPhoto(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string
        const res = await fetch('/api/drivers/profile/photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo: base64 }),
        })
        const data = await res.json()
        if (data.success) {
          setProfile({ ...profile, photo: base64 })
          refreshUser()
          alert('Foto actualizada, chamo!')
        }
        setUploadingPhoto(false)
      }
      reader.readAsDataURL(file)
    } catch {
      alert('Error al subir la foto')
      setUploadingPhoto(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/drivers/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      if (data.success) {
        setIsEditing(false)
        alert('Perfil actualizado!')
      }
    } catch {
      alert('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const photoMissing = !profile.photo

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link href="/driver" className="p-2 rounded-xl hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <span className="font-bold text-gray-900">Mi Perfil</span>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-[#FF6B00] font-medium text-sm"
          >
            {isEditing ? 'Cancelar' : 'Editar'}
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Mandatory Photo Warning */}
        {photoMissing && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-red-800">Foto de perfil obligatoria</p>
                <p className="text-sm text-red-600 mt-1">
                  Necesitas subir una foto para que los pasajeros te reconozcan. Sin foto no puedes aceptar viajes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Photo */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`w-32 h-32 rounded-full flex items-center justify-center text-5xl overflow-hidden border-4 shadow-lg cursor-pointer transition-all ${
                photoMissing
                  ? 'border-red-400 bg-red-50 hover:bg-red-100'
                  : 'border-white bg-[#FF6B00]/10'
              }`}
            >
              {profile.photo ? (
                <img src={profile.photo} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <span>{uploadingPhoto ? '⏳' : '📷'}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-10 h-10 bg-[#FF6B00] rounded-full flex items-center justify-center text-white shadow-lg"
            >
              {uploadingPhoto ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                '📷'
              )}
            </button>
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">{profile.firstName} {profile.lastName}</h2>
          <p className="text-gray-500">{profile.phone}</p>
          <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            ✅ Conductor verificado
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h3 className="font-bold text-gray-900 mb-4">👤 Datos Personales</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Nombre</label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Apellido</label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Correo</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* License Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h3 className="font-bold text-gray-900 mb-4">🪪 Licencia de Conducir</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Número de licencia</label>
              <input
                type="text"
                value={profile.license.number}
                onChange={(e) => setProfile({ ...profile, license: { ...profile.license, number: e.target.value.toUpperCase() } })}
                disabled={!isEditing}
                placeholder="Ej: 12345678"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50 font-bold"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Fecha de vencimiento</label>
              <input
                type="date"
                value={profile.license.expiry}
                onChange={(e) => setProfile({ ...profile, license: { ...profile.license, expiry: e.target.value } })}
                disabled={!isEditing}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            La licencia debe coincidir con la que registraste. Verificada por RAPIDITO.
          </p>
        </div>

        {/* Payment Info - Pago Móvil */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h3 className="font-bold text-gray-900 mb-4">💳 Datos de Pago Móvil</h3>
          <div className="bg-orange-50 rounded-xl p-3 mb-4">
            <p className="text-xs text-orange-700">
              Estos datos son necesarios para retirar tu dinero. El retiro mínimo es <strong>$10.00</strong>.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Banco</label>
              <select
                value={profile.payment.bank}
                onChange={(e) => setProfile({ ...profile, payment: { ...profile.payment, bank: e.target.value } })}
                disabled={!isEditing}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50"
              >
                <option value="">Selecciona tu banco</option>
                <option value="0102">Banco 0102 - Banco de Venezuela</option>
                <option value="0104">Banco 0104 - Banco Venezolano de Crédito</option>
                <option value="0105">Banco 0105 - Banco Mercantil</option>
                <option value="0108">Banco 0108 - Banco Provincial</option>
                <option value="0114">Banco 0114 - Banco del Caribe</option>
                <option value="0116">Banco 0116 - Banco Occidental de Descuento</option>
                <option value="0128">Banco 0128 - Banco Exterior</option>
                <option value="0134">Banco 0134 - Banco Nacional de Crédito</option>
                <option value="0151">Banco 0151 - Banco Bicentenario</option>
                <option value="0156">Banco 0156 - Banco de Awal</option>
                <option value="0157">Banco 0157 - Banco Plaza</option>
                <option value="0163">Banco 0163 - Banco del Tesoro</option>
                <option value="0166">Banco 0166 - Banco Agrícola</option>
                <option value="0168">Banco 0168 - Banco Bancrecer</option>
                <option value="0169">Banco 0169 - Mi Banco</option>
                <option value="0171">Banco 0171 - Banco Acceso</option>
                <option value="0172">Banco 0172 - Bancamiga</option>
                <option value="0173">Banco 0173 - Banco Internacional</option>
                <option value="0174">Banco 0174 - Banco Plus</option>
                <option value="0175">Banco 0175 - Banco Solar</option>
                <option value="0177">Banco 0177 - Banco Fanb</option>
                <option value="0178">Banco 0178 - Eurobank</option>
                <option value="0179">Banco 0179 - Banco De La Gente Emprendedora</option>
                <option value="0180">Banco 0180 - Banco De La Gente</option>
                <option value="0181">Banco 0181 - Banco Activo</option>
                <option value="0182">Banco 0182 - Banco Viracocha</option>
                <option value="0183">Banco 0183 - Banco La Guaira</option>
                <option value="0185">Banco 0185 - Banco Fondo Común</option>
                <option value="0186">Banco 0186 - Banco Banfojanda</option>
                <option value="0187">Banco 0187 - Banco Dimon</option>
                <option value="0188">Banco 0188 - Banco Atlántico</option>
                <option value="0189">Banco 0189 - Banco Bolivariano</option>
                <option value="0190">Banco 0190 - Banco Caroní</option>
                <option value="0191">Banco 0191 - Banco Country</option>
                <option value="0192">Banco 0192 - Banco ECO</option>
                <option value="0601">Banco 0601 - Mi Banco</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-500">Teléfono (10 dígitos)</label>
              <div className="flex">
                <span className="flex items-center rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  +58
                </span>
                <input
                  type="tel"
                  value={profile.payment.phone}
                  onChange={(e) => setProfile({ ...profile, payment: { ...profile.payment, phone: e.target.value.replace(/\D/g, '').slice(0, 10) } })}
                  disabled={!isEditing}
                  placeholder="04121234567"
                  className="flex-1 rounded-r-xl border border-gray-200 px-4 py-2 text-sm disabled:bg-gray-50"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Cédula / RIF</label>
              <input
                type="text"
                value={profile.payment.cedula}
                onChange={(e) => setProfile({ ...profile, payment: { ...profile.payment, cedula: e.target.value } })}
                disabled={!isEditing}
                placeholder="Ej: 29673250"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Nombre completo (como aparece en el banco)</label>
              <input
                type="text"
                value={profile.payment.name}
                onChange={(e) => setProfile({ ...profile, payment: { ...profile.payment, name: e.target.value } })}
                disabled={!isEditing}
                placeholder="Nombre y apellido"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Los datos deben coincidir con tu cuenta bancaria. El nombre del titular debe ser exacto.
          </p>
        </div>

        {/* Vehicle Info - Read Only */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h3 className="font-bold text-gray-900 mb-4">🏍️ Datos del Vehículo</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Tipo</span>
              <span className="font-medium text-gray-900">
                {profile.vehicle.type === 'moto' ? '🏍️ Moto' : '🚗 Carro'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Marca</span>
              <span className="font-medium text-gray-900">{profile.vehicle.brand || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Modelo</span>
              <span className="font-medium text-gray-900">{profile.vehicle.model || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Color</span>
              <span className="font-medium text-gray-900">{profile.vehicle.color || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Año</span>
              <span className="font-medium text-gray-900">{profile.vehicle.year || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">Placa</span>
              <span className="font-bold text-[#FF6B00] text-lg">{profile.vehicle.plateNumber || '—'}</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-700">
              ℹ️ Los datos del vehículo son los que registraste. Si necesitas actualizarlos, contacta soporte.
            </p>
          </div>
        </div>

        {isEditing && (
          <button
            onClick={saveProfile}
            disabled={saving || photoMissing}
            className="w-full py-3 bg-[#FF6B00] text-white font-bold rounded-2xl disabled:opacity-50"
          >
            {saving ? 'Guardando...' : photoMissing ? 'Sube tu foto primero' : 'Guardar cambios'}
          </button>
        )}
      </main>
    </div>
  )
}
