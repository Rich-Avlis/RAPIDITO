'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/auth-provider'
import Link from 'next/link'

export default function DriverProfile() {
  const { user } = useAuth()
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
  })
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

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
        alert('¡Perfil actualizado, chamo!')
      }
    } catch (error) {
      alert('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

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
        {/* Profile Photo */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full bg-[#FF6B00]/10 flex items-center justify-center text-5xl overflow-hidden border-4 border-white shadow-lg">
              {profile.photo ? (
                <img src={profile.photo} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <span>{profile.firstName?.charAt(0) || '👤'}</span>
              )}
            </div>
            {isEditing && (
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-[#FF6B00] rounded-full flex items-center justify-center text-white shadow-lg">
                📷
              </button>
            )}
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

        {/* Vehicle Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h3 className="font-bold text-gray-900 mb-4">🏍️ Datos de la Moto</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Marca</label>
                <input
                  type="text"
                  value={profile.vehicle.brand}
                  onChange={(e) => setProfile({ ...profile, vehicle: { ...profile.vehicle, brand: e.target.value } })}
                  disabled={!isEditing}
                  placeholder="Honda, Yamaha, etc."
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500">Modelo</label>
                <input
                  type="text"
                  value={profile.vehicle.model}
                  onChange={(e) => setProfile({ ...profile, vehicle: { ...profile.vehicle, model: e.target.value } })}
                  disabled={!isEditing}
                  placeholder="Click, Intruder, etc."
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Color</label>
                <input
                  type="text"
                  value={profile.vehicle.color}
                  onChange={(e) => setProfile({ ...profile, vehicle: { ...profile.vehicle, color: e.target.value } })}
                  disabled={!isEditing}
                  placeholder="Negro, Rojo, etc."
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500">Año</label>
                <input
                  type="text"
                  value={profile.vehicle.year}
                  onChange={(e) => setProfile({ ...profile, vehicle: { ...profile.vehicle, year: e.target.value } })}
                  disabled={!isEditing}
                  placeholder="2023"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Placa</label>
              <input
                type="text"
                value={profile.vehicle.plateNumber}
                onChange={(e) => setProfile({ ...profile, vehicle: { ...profile.vehicle, plateNumber: e.target.value.toUpperCase() } })}
                disabled={!isEditing}
                placeholder="ABC-123"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50 font-bold"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Tipo de vehículo</label>
              <select
                value={profile.vehicle.type}
                onChange={(e) => setProfile({ ...profile, vehicle: { ...profile.vehicle, type: e.target.value } })}
                disabled={!isEditing}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50"
              >
                <option value="moto">🏍️ Moto</option>
                <option value="car">🚗 Carro</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Estos datos son los que verá el pasajero cuando te seleccione. ¡Que se vean bonitos, chamo!
          </p>
        </div>

        {isEditing && (
          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full py-3 bg-[#FF6B00] text-white font-bold rounded-2xl disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        )}
      </main>
    </div>
  )
}
