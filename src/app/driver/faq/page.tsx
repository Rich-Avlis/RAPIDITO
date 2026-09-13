'use client'

import { useState } from 'react'
import Link from 'next/link'

interface TutorialStep {
  id: number
  title: string
  description: string
  icon: string
  details: string[]
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: '¡Bienvenido, conductor!',
    description: 'Aquí te explicamos todo lo que necesitas saber para empezar a ganar dinero con RAPIDITO.',
    icon: '🏍️',
    details: [
      'RAPIDITO es la app de transporte #1 en Quíbor, Lara',
      'Tú defines tu horario - trabaja cuando quieras',
      'Gana dinero ayudando a la gente a moverse',
    ],
  },
  {
    id: 2,
    title: 'Ponete en línea',
    description: 'Abre la app y presiona el botón "PONERME EN LÍNEA". Asegúrate de tener tu ubicación activada.',
    icon: '🟢',
    details: [
      'Activa tu ubicación GPS',
      'Presiona el botón grande naranja',
      'Espera solicitudes de viaje cerca de ti',
      'Mantente en zonas con más movimiento',
    ],
  },
  {
    id: 3,
    title: 'Acepta viajes',
    description: 'Cuando alguien pida un viaje cercano, te llegará la solicitud con todos los detalles.',
    icon: '📱',
    details: [
      'Verás el nombre del pasajero y su calificación',
      'El punto de recogida y el destino',
      'La ganancia estimada del viaje',
      'Puedes aceptar, contraofertar o rechazar',
    ],
  },
  {
    id: 4,
    title: 'Recoge al pasajero',
    description: 'Una vez aceptado, ve al punto de recogida. El pasajero puede ver tu ubicación en tiempo real.',
    icon: '📍',
    details: [
      'Sigue las indicaciones del mapa',
      'Llame al pasajero si no lo encuentras',
      'Espera pacientemente - el pasajero va camino',
      'Confirma cuando lo subas al vehículo',
    ],
  },
  {
    id: 5,
    title: 'Completa el viaje',
    description: 'Lleva al pasajero a su destino de forma segura. Al llegar, confirma la llegada en la app.',
    icon: '🏁',
    details: [
      'Conduce seguro - la seguridad es primero',
      'Confirma la llegada en la app',
      'El pasajero te calificará',
      'La ganancia se refleja en tu cartera',
    ],
  },
  {
    id: 6,
    title: 'Gana y retira tu dinero',
    description: 'Tu ganancia se acumula en tu cartera. Puedes solicitar retiros cuando quieras.',
    icon: '💰',
    details: [
      'Ve a "Mi Cartera" para ver tu saldo',
      'Solicita retiro cuando tengas saldo disponible',
      'El dinero llega a tu cuenta bancaria',
      'Mínimo $5.00 para retirar',
    ],
  },
]

export default function DriverFAQ() {
  const [currentStep, setCurrentStep] = useState(0)
  const [showAll, setShowAll] = useState(false)

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
            <span className="font-bold text-gray-900">Tutorial del Conductor</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Tutorial Mode */}
        {!showAll && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{tutorialSteps[currentStep].icon}</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {tutorialSteps[currentStep].title}
              </h2>
              <p className="text-gray-600">
                {tutorialSteps[currentStep].description}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {tutorialSteps[currentStep].details.map((detail, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-[#FF6B00] mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">{detail}</span>
                </div>
              ))}
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-6">
              {tutorialSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${
                    idx === currentStep ? 'bg-[#FF6B00]' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-2xl font-bold text-gray-700"
                >
                  Anterior
                </button>
              )}
              <button
                onClick={() => {
                  if (currentStep < tutorialSteps.length - 1) {
                    setCurrentStep(currentStep + 1)
                  } else {
                    setShowAll(true)
                  }
                }}
                className="flex-1 py-3 bg-[#FF6B00] text-white rounded-2xl font-bold"
              >
                {currentStep < tutorialSteps.length - 1 ? 'Siguiente' : '¡Entendido!'}
              </button>
            </div>
          </div>
        )}

        {/* All Steps View */}
        {showAll && (
          <>
            <div className="bg-[#FF6B00]/10 rounded-2xl p-4 mb-6 text-center">
              <p className="text-[#FF6B00] font-bold">¡Tutorial completado! 🎉</p>
              <p className="text-sm text-gray-600 mt-1">Aquí tienes todos los pasos por si los necesitas</p>
            </div>

            <div className="space-y-4">
              {tutorialSteps.map((step) => (
                <div key={step.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{step.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{step.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      <ul className="mt-2 space-y-1">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="text-xs text-gray-500 flex items-center gap-2">
                            <span className="text-[#FF6B00]">•</span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <Link href="/driver">
                <button className="w-full py-3 bg-[#FF6B00] text-white font-bold rounded-2xl">
                  ¡Empezar a conducir!
                </button>
              </Link>
              <button
                onClick={() => { setShowAll(false); setCurrentStep(0) }}
                className="w-full py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-2xl"
              >
                Ver tutorial de nuevo
              </button>
            </div>
          </>
        )}

        {/* FAQ Section */}
        <div className="mt-8">
          <h3 className="font-bold text-gray-900 mb-4">Preguntas Frecuentes</h3>
          <div className="space-y-3">
            {[
              { q: '¿Cuánto gano por viaje?', a: 'Depende de la distancia y el precio acordado. Tú ofreces tu precio o aceptas el sugerido.' },
              { q: '¿Cómo retiro mi dinero?', a: 'Ve a Mi Cartera → Solicitar Retiro. El mínimo es $5.00. Llega a tu cuenta en 24-48 horas.' },
              { q: '¿Qué pasa si cancelo un viaje?', a: 'Si cancelas después de aceptar, afecta tu calificación. Solo cancela si es necesario.' },
              { q: '¿Necesito seguro del vehículo?', a: 'Sí, es obligatorio tener SOAT vigente. Sube la foto en Documentación.' },
              { q: '¿Puedo rechazar viajes?', a: 'Sí, puedes rechazar. Pero no abuses porque afecta tu calificación.' },
            ].map((item, idx) => (
              <details key={idx} className="bg-white rounded-2xl p-4 shadow-sm">
                <summary className="font-medium text-gray-900 cursor-pointer">{item.q}</summary>
                <p className="text-sm text-gray-600 mt-2">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
