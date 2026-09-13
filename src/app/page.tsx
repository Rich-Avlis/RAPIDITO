'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-bold text-xl shadow-lg shadow-primary/30">
              R
            </div>
            <span className="text-xl font-bold text-gray-900">RAPIDITO</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button className="shadow-lg shadow-primary/30">Registrarse</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/10 py-20">
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 text-6xl opacity-10 animate-float">🏍️</div>
          <div className="absolute top-20 right-20 text-5xl opacity-10 animate-float" style={{ animationDelay: '1s' }}>🚗</div>
          <div className="absolute bottom-10 left-1/4 text-4xl opacity-10 animate-float" style={{ animationDelay: '2s' }}>🗺️</div>
          <div className="absolute bottom-20 right-1/4 text-5xl opacity-10 animate-float" style={{ animationDelay: '0.5s' }}>📍</div>

          <div className="container mx-auto px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Left content */}
              <div className="text-center lg:text-left">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                  </span>
                  Disponible en Quíbor, Lara
                </div>
                <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 lg:text-6xl">
                  Tu viaje,{' '}
                  <span className="text-primary">rápido</span> y{' '}
                  <span className="text-primary">seguro</span>
                </h1>
                <p className="mb-10 text-xl text-gray-600">
                  Conectamos pasajeros con conductores de confianza en Quíbor y toda Venezuela.
                  Solicita tu viaje en segundos.
                </p>
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
                  <Link href="/register?role=PASSENGER">
                    <Button size="xl" className="w-full shadow-lg shadow-primary/30 sm:w-auto">
                      🚗 Solicitar Viaje
                    </Button>
                  </Link>
                  <Link href="/register?role=DRIVER">
                    <Button size="xl" variant="outline" className="w-full border-primary text-primary hover:bg-primary/5 sm:w-auto">
                      🏍️ Ser Conductor
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="mt-12 grid grid-cols-3 gap-6 text-center lg:text-left">
                  <div>
                    <p className="text-3xl font-bold text-primary">100+</p>
                    <p className="text-sm text-gray-500">Viajes realizados</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">50+</p>
                    <p className="text-sm text-gray-500">Conductores activos</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">4.9</p>
                    <p className="text-sm text-gray-500">Calificación promedio</p>
                  </div>
                </div>
              </div>

              {/* Right - Visual */}
              <div className="relative hidden lg:block">
                <div className="relative mx-auto h-96 w-96">
                  {/* Map background */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-2xl">
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <div className="text-8xl mb-4">🗺️</div>
                        <p className="text-primary font-medium">Mapa en tiempo real</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating driver card */}
                  <div className="absolute -left-10 top-10 rounded-xl bg-white p-4 shadow-xl animate-ride">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                        CM
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Carlos M.</p>
                        <p className="text-sm text-gray-500">⭐ 4.9 • 327 viajes</p>
                        <p className="text-xs text-primary">📍 4 min</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating ride card */}
                  <div className="absolute -right-5 bottom-20 rounded-xl bg-white p-4 shadow-xl animate-float">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 text-xl">
                        ✅
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Viaje completado</p>
                        <p className="text-sm text-gray-500">Plaza Bolívar</p>
                        <p className="text-lg font-bold text-primary">$1.50</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                ¿Cómo funciona?
              </h2>
              <p className="text-gray-600">Solicita tu viaje en 4 simples pasos</p>
            </div>
            <div className="grid gap-8 md:grid-cols-4">
              {[
                { step: '1', title: 'Ingresa tu destino', desc: 'Selecciona tu punto de recogida y destino en el mapa.', icon: '📍', color: 'bg-blue-100 text-blue-600' },
                { step: '2', title: 'Conoce el precio', desc: 'El sistema calcula la tarifa estimada automáticamente.', icon: '💰', color: 'bg-green-100 text-green-600' },
                { step: '3', title: 'Negocia si quieres', desc: 'Puedes ofrecer un precio o aceptar la tarifa sugerida.', icon: '🤝', color: 'bg-yellow-100 text-yellow-600' },
                { step: '4', title: '¡Viaja!', desc: 'Sigue al conductor en tiempo real y disfruta del viaje.', icon: '🏍️', color: 'bg-purple-100 text-purple-600' },
              ].map((item) => (
                <div key={item.step} className="relative text-center">
                  <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${item.color} text-2xl`}>
                    {item.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white font-bold">
                    {item.step}
                  </div>
                  <h3 className="mb-2 font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                ¿Por qué RAPIDITO?
              </h2>
              <p className="text-gray-600">La mejor experiencia de transporte</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="mb-4 text-5xl">⚡</div>
                  <h3 className="mb-3 text-xl font-semibold text-gray-900">Rápido</h3>
                  <p className="text-gray-600">
                    Encuentra conductores cercanos y llega a tu destino en minutos.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="mb-4 text-5xl">🛡️</div>
                  <h3 className="mb-3 text-xl font-semibold text-gray-900">Seguro</h3>
                  <p className="text-gray-600">
                    Conductores verificados y documentos validados para tu tranquilidad.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="mb-4 text-5xl">💰</div>
                  <h3 className="mb-3 text-xl font-semibold text-gray-900">Económico</h3>
                  <p className="text-gray-600">
                    Tarifas justas con opción de negociar. Paga en efectivo o PagoMóvil.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary to-primary-hover">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-6 text-3xl font-bold text-white">
              ¿Listo para viajar?
            </h2>
            <p className="mb-8 text-lg text-white/80">
              Únete a miles de personas que ya confían en RAPIDITO
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/register?role=PASSENGER">
                <Button size="xl" variant="secondary" className="w-full sm:w-auto">
                  🚗 Quiero viajar
                </Button>
              </Link>
              <Link href="/register?role=DRIVER">
                <Button size="xl" className="w-full bg-white text-primary hover:bg-gray-100 sm:w-auto">
                  🏍️ Quiero conducir
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
                R
              </div>
              <span className="font-bold text-gray-900">RAPIDITO</span>
            </div>
            
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} RAPIDITO. Quíbor, Estado Lara, Venezuela
            </p>

            <a 
              href="https://asistid.net" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
            >
              Powered by 
              <span className="font-semibold text-primary group-hover:text-primary-hover">
                Asistid
              </span>
              <svg 
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
