'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import FluidOrb from '@/components/ui/fluid-orb'

const HERO_ROUTE =
  'M60 340 L60 226 Q60 210 76 210 L124 210 Q140 210 140 194 L140 146 Q140 130 156 130 L220 130'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-header">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-r.png"
              alt="R RAPIDITO"
              width={48}
              height={33}
              priority
              className="h-9 w-auto drop-shadow-md"
            />
            <span className="text-xl font-bold text-gray-900">RAPIDITO</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="glass-card border-0">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button className="glass-btn border-0 text-white">Registrarse</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden glassmorphism-bg py-20">
          {/* FluidOrb decorations */}
          <div className="absolute -top-20 -right-20 opacity-40 pointer-events-none">
            <FluidOrb size={320} color="#FF6B00" />
          </div>
          <div className="absolute -bottom-32 -left-32 opacity-25 pointer-events-none">
            <FluidOrb size={400} color="#E55D00" />
          </div>
          {/* Glass blobs */}
          <div className="glass-blob w-72 h-72 -left-20 top-1/3 bg-[#FF6B00]/30" />
          <div className="glass-blob w-64 h-64 right-10 -bottom-16 bg-[#FDBA3C]/40" />
          {/* Decorative elements - Lara icons */}
          <div className="absolute top-10 left-10 text-6xl opacity-10 animate-float">
            <svg viewBox="0 0 100 200" className="w-16 h-32 text-[#FF6B00]">
              <polygon points="50,0 60,180 40,180" fill="currentColor" opacity="0.3"/>
              <polygon points="45,180 55,180 52,200 48,200" fill="currentColor" opacity="0.4"/>
              <circle cx="50" cy="10" r="5" fill="currentColor" opacity="0.5"/>
            </svg>
          </div>
          <div className="absolute top-20 right-20 text-5xl opacity-10 animate-float" style={{ animationDelay: '1s' }}>
            <svg viewBox="0 0 120 100" className="w-24 h-20 text-[#FF6B00]">
              <ellipse cx="60" cy="50" rx="50" ry="40" fill="currentColor" opacity="0.2"/>
              <ellipse cx="80" cy="40" rx="35" ry="30" fill="currentColor" opacity="0.3"/>
              <ellipse cx="40" cy="55" rx="25" ry="20" fill="currentColor" opacity="0.25"/>
            </svg>
          </div>
          <div className="absolute bottom-10 left-1/4 text-4xl opacity-10 animate-float" style={{ animationDelay: '2s' }}>🏍️</div>
          <div className="absolute bottom-20 right-1/4 text-5xl opacity-10 animate-float" style={{ animationDelay: '0.5s' }}>🗺️</div>

          <div className="container mx-auto px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Left content */}
              <div className="text-center lg:text-left">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#FF6B00]/10 px-4 py-2 text-sm text-[#FF6B00]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B00] opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF6B00]"></span>
                  </span>
                  Disponible en Quíbor, Lara 🇻🇪
                </div>
                <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 lg:text-6xl">
                  Tu viaje,{' '}
                  <span className="text-[#FF6B00]">rápido</span> y{' '}
                  <span className="text-[#FF6B00]">seguro</span>
                </h1>
                <p className="mb-10 text-xl text-gray-600">
                  Conectamos pasajeros con conductores de confianza en Quíbor y todo el Estado Lara. 
                  Solicita tu viaje en segundos. <strong className="text-[#FF6B00]">¡Épa, chamo!</strong>
                </p>
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
                  <Link href="/register?role=PASSENGER">
                    <Button size="xl" className="w-full glass-btn border-0 text-white sm:w-auto">
                      🚗 Solicitar Viaje
                    </Button>
                  </Link>
                  <Link href="/register?role=DRIVER">
                    <Button size="xl" className="w-full glass-card text-[#FF6B00] border-0 hover:bg-white/70 sm:w-auto">
                      🏍️ Ser Conductor
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="mt-12 grid grid-cols-3 gap-4 text-center lg:text-left">
                  <div className="glass-card rounded-2xl p-4">
                    <p className="text-3xl font-bold text-[#FF6B00]">100+</p>
                    <p className="text-sm text-gray-500">Viajes realizados</p>
                  </div>
                  <div className="glass-card rounded-2xl p-4">
                    <p className="text-3xl font-bold text-[#FF6B00]">50+</p>
                    <p className="text-sm text-gray-500">Conductores activos</p>
                  </div>
                  <div className="glass-card rounded-2xl p-4">
                    <p className="text-3xl font-bold text-[#FF6B00]">4.9</p>
                    <p className="text-sm text-gray-500">Calificación promedio</p>
                  </div>
                </div>
              </div>

              {/* Right - Animated route map */}
              <div className="relative hidden lg:block">
                <div className="relative mx-auto h-96 w-96">
                  {/* Map card */}
                  <div className="absolute inset-0 overflow-hidden rounded-3xl border border-white/80 bg-[#F3EEE7] shadow-[0_24px_64px_rgba(0,0,0,0.16)] ring-1 ring-black/5">
                    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden="true">
                      {/* Base blocks */}
                      <rect width="400" height="400" fill="#F3EEE7" />
                      {/* Parks */}
                      <rect x="70" y="60" width="60" height="60" rx="8" fill="#DCFCE7" />
                      <rect x="310" y="300" width="45" height="45" rx="8" fill="#DCFCE7" opacity="0.8" />
                      {/* Buildings */}
                      <g fill="#E7DFD4">
                        <rect x="75" y="145" width="50" height="55" rx="4" />
                        <rect x="155" y="60" width="55" height="55" rx="4" />
                        <rect x="235" y="145" width="50" height="50" rx="4" />
                        <rect x="75" y="225" width="50" height="50" rx="4" />
                        <rect x="235" y="305" width="50" height="45" rx="4" />
                        <rect x="310" y="145" width="40" height="50" rx="4" />
                        <rect x="155" y="305" width="55" height="45" rx="4" />
                        <rect x="310" y="60" width="40" height="55" rx="4" />
                      </g>
                      {/* Streets */}
                      <g stroke="#FFFFFF" strokeLinecap="round">
                        <line x1="0" y1="55" x2="400" y2="55" strokeWidth="10" />
                        <line x1="0" y1="130" x2="400" y2="130" strokeWidth="14" />
                        <line x1="0" y1="210" x2="400" y2="210" strokeWidth="14" />
                        <line x1="0" y1="290" x2="400" y2="290" strokeWidth="10" />
                        <line x1="0" y1="360" x2="400" y2="360" strokeWidth="10" />
                        <line x1="60" y1="0" x2="60" y2="400" strokeWidth="10" />
                        <line x1="140" y1="0" x2="140" y2="400" strokeWidth="10" />
                        <line x1="220" y1="0" x2="220" y2="400" strokeWidth="10" />
                        <line x1="300" y1="0" x2="300" y2="400" strokeWidth="10" />
                        <line x1="360" y1="0" x2="360" y2="400" strokeWidth="14" />
                      </g>
                      {/* Route */}
                      <path d={HERO_ROUTE} fill="none" stroke="#FFFFFF" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
                      <path d={HERO_ROUTE} fill="none" stroke="#FF6B00" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d={HERO_ROUTE} fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeDasharray="10 14" opacity="0.85" className="route-flow" />
                      {/* Origin ping */}
                      <circle cx="60" cy="340" r="8" fill="none" stroke="#FF6B00" strokeWidth="3">
                        <animate attributeName="r" values="8;24" dur="1.8s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0" dur="1.8s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="60" cy="340" r="7" fill="#FF6B00" stroke="#FFFFFF" strokeWidth="3" />
                      <text x="60" y="372" textAnchor="middle" fontSize="11" fontWeight="600" fill="#6b7280">
                        Tu ubicación
                      </text>
                      {/* Destination pin */}
                      <path
                        d="M220 130 C212 118 207 112 207 106 A13 13 0 1 1 233 106 C233 112 228 118 220 130 Z"
                        fill="#FF6B00"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <circle cx="220" cy="106" r="5" fill="#FFFFFF" />
                      <text x="240" y="110" fontSize="11" fontWeight="600" fill="#6b7280">
                        Destino
                      </text>
                      {/* Moving motorcycle */}
                      <g>
                        <ellipse cx="0" cy="15" rx="10" ry="3" fill="rgba(0,0,0,0.12)" />
                        <circle r="13" fill="#FFFFFF" stroke="#FF6B00" strokeWidth="2.5" />
                        <text x="0" y="5" textAnchor="middle" fontSize="13">🏍️</text>
                        <animateMotion dur="7s" repeatCount="indefinite" path={HERO_ROUTE} />
                      </g>
                    </svg>
                  </div>
                  
                  {/* Floating driver card */}
                  <div className="absolute -left-10 top-10 rounded-2xl glass-card p-4 animate-ride">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6B00]/10 text-[#FF6B00] font-bold">
                        CM
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Carlos M.</p>
                        <p className="text-sm text-gray-500">⭐ 4.9 • 327 viajes</p>
                        <p className="text-xs text-[#FF6B00]">📍 4 min</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating ride card */}
                  <div className="absolute -right-5 bottom-20 rounded-2xl glass-card p-4 animate-float">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 text-xl">
                        ✅
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Viaje completado</p>
                        <p className="text-sm text-gray-500">Plaza Bolívar</p>
                        <p className="text-lg font-bold text-[#FF6B00]">$1.50</p>
                      </div>
                    </div>
                  </div>

                  {/* La Tinaja de Quíbor */}
                  <div className="absolute -right-5 top-20 rounded-2xl glass-card p-3">
                    <div className="flex items-center gap-2">
                      <svg viewBox="0 0 80 60" className="w-12 h-10 text-[#FF6B00]">
                        <ellipse cx="40" cy="30" rx="35" ry="25" fill="currentColor" opacity="0.3"/>
                        <ellipse cx="55" cy="25" rx="20" ry="15" fill="currentColor" opacity="0.4"/>
                        <ellipse cx="25" cy="35" rx="15" ry="10" fill="currentColor" opacity="0.35"/>
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">La Tinaja</p>
                        <p className="text-[10px] text-gray-500">Quíbor, Lara</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 glassmorphism-bg-soft relative overflow-hidden">
          <div className="glass-blob w-80 h-80 -right-20 -top-20 bg-[#FF6B00]/20" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                ¿Cómo funciona, chamo?
              </h2>
              <p className="text-gray-600">Solicita tu viaje en 4 simples pasos</p>
            </div>
            <div className="grid gap-8 md:grid-cols-4">
              {[
                { step: '1', title: 'Pa\' donde vas', desc: 'Escribe tu destino y te calculamos la ruta.', icon: '📍', color: 'bg-blue-100 text-blue-600' },
                { step: '2', title: 'Conoce el precio', desc: 'Te damos la tarifa justa pa\' que viajes tranquilo.', icon: '💰', color: 'bg-green-100 text-green-600' },
                { step: '3', title: 'Negocia si quieres', desc: '¿No te cuadra el precio? ¡Haz tu oferta!', icon: '🤝', color: 'bg-yellow-100 text-yellow-600' },
                { step: '4', title: '¡Pa\' la calle!', desc: 'Sigue al conductor en tiempo real y viaja seguro.', icon: '🏍️', color: 'bg-purple-100 text-purple-600' },
              ].map((item) => (
                <div key={item.step} className="glass-card rounded-2xl p-6 text-center relative">
                  <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${item.color} text-2xl`}>
                    {item.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#FF6B00] text-xs text-white font-bold">
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
        <section className="py-20 glassmorphism-bg relative overflow-hidden">
          <div className="glass-blob w-96 h-96 -left-32 top-1/4 bg-[#FDBA3C]/30" />
          <div className="glass-blob w-72 h-72 right-0 -bottom-20 bg-[#FF6B00]/25" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                ¿Por qué RAPIDITO? ¡Épa!
              </h2>
              <p className="text-gray-600">La mejor experiencia de transporte en Lara</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="glass-card border-0">
                <CardContent className="p-8 text-center">
                  <div className="mb-4 text-5xl">⚡</div>
                  <h3 className="mb-3 text-xl font-semibold text-gray-900">Rápido como el viento</h3>
                  <p className="text-gray-600">
                    Encuentra conductores cercanos y llega a tu destino en un-vi-nue-to.
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card border-0">
                <CardContent className="p-8 text-center">
                  <div className="mb-4 text-5xl">🛡️</div>
                  <h3 className="mb-3 text-xl font-semibold text-gray-900">Seguro como casa</h3>
                  <p className="text-gray-600">
                    Conductores verificados y documentos validados pa' que viajes tranquilo.
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card border-0">
                <CardContent className="p-8 text-center">
                  <div className="mb-4 text-5xl">💰</div>
                  <h3 className="mb-3 text-xl font-semibold text-gray-900">Económico, mi pana</h3>
                  <p className="text-gray-600">
                    Tarifas justas con opción de negociar. Paga en efectivo o PagoMóvil.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Lara Section */}
        <section className="py-20 glassmorphism-bg-soft relative overflow-hidden">
          <div className="glass-blob w-80 h-80 right-10 -bottom-24 bg-[#FF6B00]/25" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="text-center lg:text-left">
                <h2 className="mb-6 text-3xl font-bold text-gray-900">
                  Nacimos en Lara,{' '}
                  <span className="text-[#FF6B00]">¡100% GUAROS!</span>
                </h2>
                <p className="mb-6 text-lg text-gray-600">
                  RAPIDITO nace del corazón de Quíbor, Estado Lara. Conocemos cada calle, cada esquina, cada rincón de nuestra tierra linda.
                </p>
                <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-2xl">🏗️</span>
                    <span>Obelisco de Barquisimeto</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-2xl">🪨</span>
                    <span>La Tinaja de Quíbor</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-2xl">🎵</span>
                    <span>Capital Musical</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-2xl">☀️</span>
                    <span>Tierra de sol</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  {/* Obelisco */}
                  <svg viewBox="0 0 100 250" className="w-32 h-64 text-[#FF6B00]">
                    <polygon points="50,0 65,220 35,220" fill="currentColor" opacity="0.8"/>
                    <polygon points="30,220 70,220 65,250 35,250" fill="currentColor" opacity="0.9"/>
                    <circle cx="50" cy="10" r="8" fill="currentColor"/>
                    {/* Base details */}
                    <rect x="25" y="230" width="50" height="20" fill="currentColor" opacity="0.7"/>
                  </svg>
                  {/* Tinaja */}
                  <svg viewBox="0 0 150 100" className="w-40 h-28 text-[#FF6B00] -mt-8 ml-20">
                    <ellipse cx="75" cy="50" rx="60" ry="40" fill="currentColor" opacity="0.6"/>
                    <ellipse cx="100" cy="40" rx="40" ry="30" fill="currentColor" opacity="0.7"/>
                    <ellipse cx="50" cy="55" rx="30" ry="20" fill="currentColor" opacity="0.65"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden py-20 bg-gradient-to-r from-[#FF6B00] to-[#E55D00]">
          <div className="absolute -top-16 -left-16 opacity-20 pointer-events-none">
            <FluidOrb size={280} color="#FFFFFF" />
          </div>
          <div className="absolute -bottom-20 -right-20 opacity-15 pointer-events-none">
            <FluidOrb size={350} color="#FFFFFF" />
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="mb-6 text-3xl font-bold text-white">
              ¿Listo pa' viajar, chamo?
            </h2>
            <p className="mb-8 text-lg text-white/80">
              Únete a miles de personas que ya confían en RAPIDITO en todo Lara
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/register?role=PASSENGER">
                <Button size="xl" className="w-full glass-card border-0 text-[#FF6B00] sm:w-auto">
                  🚗 Quiero viajar
                </Button>
              </Link>
              <Link href="/register?role=DRIVER">
                <Button size="xl" className="w-full glass-card border-0 text-[#FF6B00] sm:w-auto">
                  🏍️ Quiero conducir
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="glass-header border-t-0 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Image
                src="/logo-r.png"
                alt="R RAPIDITO"
                width={40}
                height={27}
                className="h-7 w-auto drop-shadow-sm"
              />
              <span className="font-bold text-gray-900">RAPIDITO</span>
            </div>

            <p className="text-sm text-gray-500">
              &copy; 2026 RAPIDITO. Lara, Venezuela.{' '}
              <span className="text-[#FF6B00] font-semibold">100% GUARO</span>
            </p>

            <a 
              href="https://asistid.net" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-sm text-gray-500 hover:text-[#FF6B00] transition-colors"
            >
              Powered by 
              <span className="font-semibold text-[#FF6B00] group-hover:text-[#E55D00]">
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
