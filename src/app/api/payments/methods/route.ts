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
    description: 'Transferencia bancaria Venezuela',
    isActive: true,
    bank: '0102 - Banco de Venezuela',
    phone: '0412-520-3740',
    ci: 'V-12.345.678',
  },
  {
    id: 'zelle',
    name: 'Zelle',
    icon: '💸',
    description: 'Pago electrónico USD',
    isActive: true,
    email: 'pagos@rapidito.com',
    accountName: 'Rapidito C.A.',
  },
  {
    id: 'wallet',
    name: 'Billetera RAPIDITO',
    icon: '💰',
    description: 'Saldo disponible en tu billetera',
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
