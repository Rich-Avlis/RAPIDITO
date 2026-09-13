'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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

  useEffect(() => {
    refreshUser()
  }, [])

  const refreshUser = async () => {
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
  }

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
    
    // Redirect based on role
    if (data.data.user.role === 'DRIVER') {
      router.push('/driver')
    } else if (['ADMIN', 'SUPER_ADMIN'].includes(data.data.user.role)) {
      router.push('/admin')
    } else {
      router.push('/passenger')
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
    router.push('/verify-otp')
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
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
