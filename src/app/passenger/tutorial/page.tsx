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
    title: '¡Bienvenido a RAPIDITO!',
    description: 'La app de transporte más chévere de Quíbor, Lara. Te explicamos cómo usarla.',
    icon: '🚗',
    details: [
      'Solicita viajes en segundos',
      'Paga en efectivo o PagoMóvil',
      'Sigue al conductor en tiempo real',
      '100% seguro y confiable',
    ],
  },
  {
    id: 2,
    title: 'Pa\' donde vas',
    description: 'Escribe tu destino en el buscador. Puede ser una dirección, un lugar conocido o hasta un negocio.',
    icon: '📍',
    details: [
      'Escribe el nombre del lugar',
      'Selecciona de las opciones',
      'O toca en el mapa para elegir',
      'Puedes agregar hasta 3 paradas',
    ],
  },
  {
    id: 3,
    title: 'Escoge tu vehículo',
    description: 'Elige entre Moto o Carro según tu preferencia. Cada uno tiene su precio.',
    icon: '🏍️',
    details: [
      'Moto: más rápido y económico',
      'Carro: más cómodo y espacio',
      'El precio se calcula automáticamente',
      'Tú puedes ajustar la tarifa',
    ],
  },
  {
    id: 4,
    title: 'Elige cómo pagar',
    description: 'Tienes varias opciones de pago para tu comodidad.',
    icon: '💰',
    details: [
      'Efectivo: le pagas al conductor',
      'Pago Móvil: transferencia bancaria',
      'Cartera RAPIDITO: saldo prepagado',
      'Recarga tu cartera desde la app',
    ],
  },
  {
    id: 5,
    title: '¡Viaja seguro!',
    description: 'Sigue tu viaje en tiempo real y mantente comunicado con tu conductor.',
    icon: '🛡️',
    details: [
      'Ve al conductor en el mapa',
      'Chatea con él si necesitas',
      'Comparte tu ubicación con amigos',
      'Califica al finalizar',
    ],
  },
  {
    id: 6,
    title: 'Descuentos y referidos',
    description: 'Gana descuentos compartiendo la app con tus amigos.',
    icon: '🎁',
    details: [
      '5% OFF en tus primeros 2 viajes',
      'Comparte tu código de referido',
      'Tú y tu amigo ganan 10% OFF',
      'Cada referido te da más beneficios',
    ],
  },
]

export default function PassengerTutorial() {
  const [currentStep, setCurrentStep] = useState(0)
  const [showAll, setShowAll] = useState(false)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <header className="sticky top-0 z-50 glass-header">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link href="/passenger" className="p-2 rounded-xl hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <span className="font-bold text-gray-900">Tutorial</span>
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
              <p className="text-sm text-gray-600 mt-1">Ahora sí, ¡pa' donde vas, chamo!</p>
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
              <Link href="/passenger">
                <button className="w-full py-3 bg-[#FF6B00] text-white font-bold rounded-2xl">
                  ¡Ir al mapa!
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
      </main>
    </div>
  )
}
