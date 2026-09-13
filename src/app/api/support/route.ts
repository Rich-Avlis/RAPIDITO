import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// FAQ data
const FAQ = [
  {
    id: '1',
    category: 'General',
    question: '¿Qué es RAPIDITO?',
    answer: 'RAPIDITO es una plataforma de transporte que conecta pasajeros con conductores en Quíbor, Venezuela. Ofrecemos viajes seguros, económicos y rápidos.',
  },
  {
    id: '2',
    category: 'General',
    question: '¿Cómo registro mi cuenta?',
    answer: 'Descarga la app, selecciona tu tipo de cuenta (pasajero o conductor), ingresa tu número de teléfono, completa tus datos personales y verifica tu identidad.',
  },
  {
    id: '3',
    category: 'Pagos',
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos efectivo, pago móvil venezolano, Zelle y billetera RAPIDITO.',
  },
  {
    id: '4',
    category: 'Pagos',
    question: '¿Cómo funciona el pago móvil?',
    answer: 'Selecciona "Pago Móvil" como método de pago. Recibirás los datos del banco, teléfono y cédula del destinatario. Realiza la transferencia y confirma el pago.',
  },
  {
    id: '5',
    category: 'Viajes',
    question: '¿Cómo solicito un viaje?',
    answer: 'Ingresa tu destino, selecciona el tipo de vehículo, ajusta el precio si deseas y presiona "Comenzar viaje". Un conductor cercano aceptará tu solicitud.',
  },
  {
    id: '6',
    category: 'Viajes',
    question: '¿Puedo programar un viaje?',
    answer: 'Sí, selecciona "Viaje programado" y elige la fecha y hora deseada. Un conductor será asignado automáticamente.',
  },
  {
    id: '7',
    category: 'Viajes',
    question: '¿Puedo agregar múltiples destinos?',
    answer: 'Sí, durante la selección de destino puedes agregar hasta 3 paradas intermedias.',
  },
  {
    id: '8',
    category: 'Descuentos',
    question: '¿Cómo obtengo descuentos?',
    answer: 'Tienes 5% de descuento en tus primeros 2 viajes. Además, compartiendo tu código de referido, ambos ganan 10% en 2 viajes.',
  },
  {
    id: '9',
    category: 'Conductores',
    question: '¿Cómo me convierto en conductor?',
    answer: 'Regístrate como conductor, completa tu perfil con licencia, SOAT y documentos del vehículo. Tu cuenta será verificada en 24-48 horas.',
  },
  {
    id: '10',
    category: 'Seguridad',
    question: '¿Cómo reporto un problema?',
    answer: 'Puedes contactar soporte desde la sección "Ayuda" en el menú lateral. Responderemos en menos de 24 horas.',
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let filteredFAQ = FAQ
    if (category) {
      filteredFAQ = FAQ.filter(f => f.category === category)
    }

    return NextResponse.json({ success: true, data: filteredFAQ })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { subject, message, rideId, priority } = await request.json()

    if (!subject || !message) {
      return NextResponse.json({ success: false, error: 'Asunto y mensaje requeridos' }, { status: 400 })
    }

    // Create support ticket (using a simple approach - store in ride metadata if rideId provided, or create a separate record)
    const ticket = {
      id: `TICKET-${Date.now()}`,
      userId: user.id,
      subject,
      message,
      rideId,
      priority: priority || 'NORMAL',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    }

    // In a real app, this would be saved to a SupportTicket table
    console.log('Support ticket created:', ticket)

    return NextResponse.json({
      success: true,
      data: ticket,
      message: 'Ticket de soporte creado. Responderemos en menos de 24 horas.',
    })
  } catch (error) {
    console.error('Support ticket error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}
