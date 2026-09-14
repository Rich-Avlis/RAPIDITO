import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { role } = await request.json()

    // Drivers can access passenger view, passengers can't access driver view
    if (role === 'DRIVER' && user.role !== 'DRIVER') {
      return NextResponse.json({ success: false, error: 'No eres conductor' }, { status: 403 })
    }

    // Store role choice in cookie (30 days)
    const response = NextResponse.json({ success: true })
    response.cookies.set('active_role', role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('Set role error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}
