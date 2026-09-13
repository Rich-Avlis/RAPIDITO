'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  role: string
  passengerProfile?: any
  driverProfile?: any
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (phone: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      if (data.success && data.data?.user) {
        setUser(data.data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()

    // Refresh session every 10 minutes to keep it alive
    const interval = setInterval(() => {
      refreshUser()
    }, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [refreshUser])

  const login = async (phone: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error)
    }

    setUser(data.data.user)
    
    // Use window.location for faster redirect (no React re-render lag)
    if (data.data.user.role === 'DRIVER') {
      window.location.href = '/driver'
    } else if (['ADMIN', 'SUPER_ADMIN'].includes(data.data.user.role)) {
      window.location.href = '/admin'
    } else {
      window.location.href = '/passenger'
    }
  }

  const register = async (registrationData: any) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData),
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error)
    }

    setUser(data.data.user)
    window.location.href = '/verify-otp'
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
