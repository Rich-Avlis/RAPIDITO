import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// FAQ data - Palabras de Lara
const FAQ = [
  {
    id: '1',
    category: 'General',
    question: '¿Qué es RAPIDITO?',
    answer: '¡Épa, chamo! RAPIDITO es la app de transporte más chévere de Quíbor, Lara. Te conecta con conductores pa\' que te muevas rápido y seguro por toda la región.',
  },
  {
    id: '2',
    category: 'General',
    question: '¿Cómo me registro?',
    answer: 'Bájate la app, escoge si eres pasajero o conductor, mete tu número de teléfono, completa tus datos y ¡listo, ya estás ready!',
  },
  {
    id: '3',
    category: 'Pagos',
    question: '¿Cómo pago el viaje?',
    answer: 'Tienes dos opciones: Pago Móvil/Bancaria (te pasamos los datos del destinatario) o Efectivo (le das la plata al conductor directo). ¡Tú escoges!',
  },
  {
    id: '4',
    category: 'Pagos',
    question: '¿Cómo recargo mi cartera?',
    answer: 'Mete un Pago Móvil o transferencia a nuestros datos: Banco 0102, Teléfono 04125203740, Cédula 29673250. ¡Y tu cartera se carga al toque!',
  },
  {
    id: '5',
    category: 'Viajes',
    question: '¿Cómo pido un viaje?',
    answer: 'Abre la app, donde dice "Pa\' donde vas" mete tu destino, escoge el vehículo y dale a "Comenzar viaje". En un-vi-nue-to te llega un conductor.',
  },
  {
    id: '6',
    category: 'Viajes',
    question: '¿Puedo programar un viaje?',
    answer: '¡Claro que sí, mi pana! En el menú selecciona "Viajes programados", mete la fecha y hora y tú tranquilo que ahí estaremos.',
  },
  {
    id: '7',
    category: 'Viajes',
    question: '¿Puedo hacer paradas en el camino?',
    answer: 'Sí, papá. Puedes agregar hasta 3 paradas cuando estés pidiendo el viaje. Pa\' que no se te olvide nada.',
  },
  {
    id: '8',
    category: 'Descuentos',
    question: '¿Cómo obtengo descuentos?',
    answer: '¡Tremenda offer! En tus primeros 2 viajes te damos 5% de descuento. Y si compartes tu código con un pana, los dos ganan 10% en 2 viajes. ¡Eso es chimbo!',
  },
  {
    id: '9',
    category: 'Conductores',
    question: '¿Cómo me hago conductor?',
    answer: 'Regístrate como conductor, completa tu perfil con la licencia, el SOAT y los papeles del carro. En 24-48 horas te verificamos y ¡pa\' la calle!',
  },
  {
    id: '10',
    category: 'Seguridad',
    question: '¿Qué hago si tengo un problema?',
    answer: 'Mándanos un mensaje por Telegram o crea un ticket desde la app. ¡Estamos pa\' ayudarte, chamo! Respondemos rapidito.',
  },
  {
    id: '11',
    category: 'General',
    question: '¿Dónde opera RAPIDITO?',
    answer: 'Por ahora estamos en Quíbor y alrededores de Lara. ¡Pero vamos creciendo como el flaco! Pronto en más ciudades.',
  },
  {
    id: '12',
    category: 'Pagos',
    question: '¿Qué es la cartera?',
    answer: 'La cartera es tu billetera virtual. Recargas plata ahí y pagas los viajes desde ahí. ¡Así no andas con efectivo encima!',
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

    console.log('Support ticket created:', ticket)

    return NextResponse.json({
      success: true,
      data: ticket,
      message: 'Ticket creado. ¡Te respondemos rapidito!',
    })
  } catch (error) {
    console.error('Support ticket error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}
