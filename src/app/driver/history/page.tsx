'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useTheme, themes } from '@/providers/theme-provider'
import Link from 'next/link'

interface Ride {
  id: string
  status: string
  originAddress: string
  destAddress: string
  estimatedFare: number
  distanceKm: number
  durationMinutes: number
  createdAt: string
  passenger?: {
    user: { firstName: string; lastName: string }
  }
  ratings?: { score: number }[]
  metadata?: string
}

export default function DriverHistory() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const t = themes[theme]
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({ totalEarned: 0, totalTrips: 0, avgRating: 0 })

  useEffect(() => {
    loadRides()
  }, [filter, page])

  const loadRides = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '10' })
      if (filter !== 'all') params.set('status', filter.toUpperCase())
      
      const res = await fetch(`/api/rides/history?${params}`)
      const data = await res.json()
      if (data.success) {
        setRides(data.data.rides)
        setTotalPages(data.data.pagination.pages)
        
        // Calculate stats
        const completed = data.data.rides.filter((r: Ride) => r.status === 'COMPLETED')
        const totalEarned = completed.reduce((sum: number, r: Ride) => sum + (r.estimatedFare || 0), 0)
        const avgRating = completed.reduce((sum: number, r: Ride) => sum + (r.ratings?.[0]?.score || 0), 0) / (completed.length || 1)
        
        setStats({
          totalEarned,
          totalTrips: completed.length,
          avgRating: Math.round(avgRating * 10) / 10,
        })
      }
    } catch (error) {
      console.error('Error loading rides:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#22C55E'
      case 'CANCELLED': return '#EF4444'
      default: return t.textSecondary
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Completado'
      case 'CANCELLED': return 'Cancelado'
      case 'SEARCHING_DRIVER': return 'Buscando'
      case 'DRIVER_ASSIGNED': return 'Asignado'
      case 'IN_PROGRESS': return 'En curso'
      default: return status
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: t.bg }}>
      {/* Header */}
      <div className="p-4 flex items-center gap-4" style={{ backgroundColor: t.bgSecondary }}>
        <Link href="/driver" className="p-2 rounded-xl" style={{ backgroundColor: t.bgTertiary }}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: t.text }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold" style={{ color: t.text }}>Historial de Viajes</h1>
      </div>

      {/* Stats Cards */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: t.bgSecondary }}>
          <p className="text-2xl font-bold" style={{ color: t.primary }}>${stats.totalEarned.toFixed(2)}</p>
          <p className="text-xs" style={{ color: t.textSecondary }}>Ganado</p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: t.bgSecondary }}>
          <p className="text-2xl font-bold" style={{ color: t.primary }}>{stats.totalTrips}</p>
          <p className="text-xs" style={{ color: t.textSecondary }}>Viajes</p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: t.bgSecondary }}>
          <p className="text-2xl font-bold" style={{ color: t.primary }}>⭐ {stats.avgRating}</p>
          <p className="text-xs" style={{ color: t.textSecondary }}>Rating</p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-4 flex gap-2 overflow-x-auto">
        {(['all', 'completed', 'cancelled'] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1) }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${filter === f ? 'text-white' : ''}`}
            style={{ backgroundColor: filter === f ? t.primary : t.bgTertiary, color: filter === f ? 'white' : t.text }}
          >
            {f === 'all' ? 'Todos' : f === 'completed' ? 'Completados' : 'Cancelados'}
          </button>
        ))}
      </div>

      {/* Rides List */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <p style={{ color: t.textSecondary }}>Cargando...</p>
          </div>
        ) : rides.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">🚗</p>
            <p style={{ color: t.textSecondary }}>No hay viajes</p>
          </div>
        ) : (
          rides.map((ride) => (
            <div key={ride.id} className="rounded-2xl p-4" style={{ backgroundColor: t.bgSecondary }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: t.text }}>{ride.originAddress}</p>
                  <p className="text-xs" style={{ color: t.textSecondary }}>→ {ride.destAddress}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: getStatusColor(ride.status) + '20', color: getStatusColor(ride.status) }}>
                  {getStatusText(ride.status)}
                </span>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-4 text-xs" style={{ color: t.textSecondary }}>
                  <span>📏 {ride.distanceKm?.toFixed(1)} km</span>
                  <span>⏱️ {ride.durationMinutes} min</span>
                  <span>📅 {new Date(ride.createdAt).toLocaleDateString('es-VE')}</span>
                </div>
                <span className="font-bold" style={{ color: t.text }}>${ride.estimatedFare?.toFixed(2)}</span>
              </div>

              {ride.passenger && (
                <div className="mt-2 pt-2 border-t flex items-center gap-2 text-xs" style={{ borderColor: t.border, color: t.textSecondary }}>
                  <span>👤</span>
                  <span>{ride.passenger.user.firstName}</span>
                  {ride.ratings && ride.ratings[0] && (
                    <span className="ml-auto">⭐ {ride.ratings[0].score}</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm disabled:opacity-50"
              style={{ backgroundColor: t.bgTertiary, color: t.text }}
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-sm" style={{ color: t.textSecondary }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl text-sm disabled:opacity-50"
              style={{ backgroundColor: t.bgTertiary, color: t.text }}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
