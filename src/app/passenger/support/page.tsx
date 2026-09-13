'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useTheme, themes } from '@/providers/theme-provider'
import Link from 'next/link'

interface FAQ {
  id: string
  category: string
  question: string
  answer: string
}

export default function PassengerSupport() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const t = themes[theme]
  const [faq, setFaq] = useState<FAQ[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showContactForm, setShowContactForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadFAQ()
  }, [])

  const loadFAQ = async () => {
    try {
      const res = await fetch('/api/support')
      const data = await res.json()
      if (data.success) setFaq(data.data)
    } catch (error) {
      console.error('Error loading FAQ:', error)
    }
  }

  const categories = [...new Set(faq.map(f => f.category))]

  const filteredFAQ = selectedCategory ? faq.filter(f => f.category === selectedCategory) : faq

  const submitTicket = async () => {
    if (!subject || !message) return
    setSending(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, priority: 'NORMAL' }),
      })
      const data = await res.json()
      if (data.success) {
        alert('¡Ticket enviado! Responderemos en menos de 24 horas.')
        setShowContactForm(false)
        setSubject('')
        setMessage('')
      }
    } catch (error) {
      alert('Error al enviar ticket')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: t.bg }}>
      {/* Header */}
      <div className="p-4 flex items-center gap-4" style={{ backgroundColor: t.bgSecondary }}>
        <Link href="/passenger" className="p-2 rounded-xl" style={{ backgroundColor: t.bgTertiary }}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: t.text }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold" style={{ color: t.text }}>Ayuda y Soporte</h1>
      </div>

      {/* Quick Actions */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowContactForm(true)}
          className="rounded-2xl p-4 text-center"
          style={{ backgroundColor: t.primary }}
        >
          <span className="text-2xl">💬</span>
          <p className="text-sm font-bold text-white mt-2">Contactar Soporte</p>
        </button>
        <a
          href="https://wa.me/584125203740"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl p-4 text-center"
          style={{ backgroundColor: '#25D366' }}
        >
          <span className="text-2xl">📱</span>
          <p className="text-sm font-bold text-white mt-2">WhatsApp</p>
        </a>
      </div>

      {/* Categories */}
      <div className="px-4 pb-2">
        <p className="text-sm font-medium mb-2" style={{ color: t.textSecondary }}>Categorías</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${!selectedCategory ? 'text-white' : ''}`}
            style={{ backgroundColor: !selectedCategory ? t.primary : t.bgTertiary, color: !selectedCategory ? 'white' : t.text }}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${selectedCategory === cat ? 'text-white' : ''}`}
              style={{ backgroundColor: selectedCategory === cat ? t.primary : t.bgTertiary, color: selectedCategory === cat ? 'white' : t.text }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ List */}
      <div className="p-4 space-y-2">
        {filteredFAQ.map((item) => (
          <div key={item.id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: t.bgSecondary }}>
            <button
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className="w-full p-4 text-left flex items-center justify-between"
            >
              <span className="font-medium text-sm" style={{ color: t.text }}>{item.question}</span>
              <svg
                className={`w-5 h-5 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: t.textSecondary }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedId === item.id && (
              <div className="px-4 pb-4">
                <p className="text-sm" style={{ color: t.textSecondary }}>{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[2000]" onClick={() => setShowContactForm(false)}>
          <div className="w-full max-w-md rounded-t-3xl p-6" style={{ backgroundColor: t.bgSecondary }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: t.border }} />
            <h3 className="text-xl font-bold mb-4" style={{ color: t.text }}>Contactar Soporte</h3>
            
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto"
              className="w-full rounded-2xl px-4 py-3 text-sm mb-3"
              style={{ backgroundColor: t.bgTertiary, color: t.text }}
            />
            
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe tu problema..."
              className="w-full rounded-2xl px-4 py-3 text-sm mb-4"
              style={{ backgroundColor: t.bgTertiary, color: t.text }}
              rows={4}
            />

            <button
              onClick={submitTicket}
              disabled={sending || !subject || !message}
              className="w-full rounded-2xl py-3 font-bold disabled:opacity-50"
              style={{ backgroundColor: t.accent, color: t.primaryText }}
            >
              {sending ? 'Enviando...' : 'Enviar Ticket'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
