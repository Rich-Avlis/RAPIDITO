import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

// Payment methods configuration
const PAYMENT_METHODS = [
  {
    id: 'cash',
    name: 'Efectivo',
    icon: '💵',
    description: 'Paga en efectivo al conductor',
    isActive: true,
  },
  {
    id: 'pago_movil',
    name: 'Pago Móvil',
    icon: '📱',
    description: 'Transferencia bancaria',
    isActive: true,
    bank: '0102',
    phone: '04125203740',
    ci: '29673250',
    holder: 'Rapidito C.A.',
  },
  {
    id: 'cartera',
    name: 'Cartera RAPIDITO',
    icon: '💰',
    description: 'Paga desde tu saldo disponible',
    isActive: true,
  },
]

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    return NextResponse.json({ success: true, data: PAYMENT_METHODS })
  } catch (error) {
    console.error('Get payment methods error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}
