'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type DocumentType =
  | 'cedula'
  | 'license'
  | 'medical_certificate'
  | 'vehicle_registration'
  | 'soat'
  | 'tax_receipt'
  | 'helmet_conductor'
  | 'helmet_passenger'
  | 'vehicle_photo_front'
  | 'vehicle_photo_back'
  | 'vehicle_photo_side'
  | 'driver_photo'

interface DocumentConfig {
  id: DocumentType
  name: string
  category: 'identification' | 'driver' | 'vehicle' | 'helmet' | 'photo'
  guide: string
  tips: { text: string; type: 'do' | 'dont' }[]
  icon: string
}

const documentConfigs: DocumentConfig[] = [
  {
    id: 'cedula',
    name: 'Cédula / Documento de Identidad',
    category: 'identification',
    guide: 'COLOCA EL DOCUMENTO DENTRO DEL MARCO',
    tips: [
      { text: 'Documento completo', type: 'do' },
      { text: 'Buena iluminación', type: 'do' },
      { text: 'Texto legible', type: 'do' },
      { text: 'Evita reflejos', type: 'dont' },
      { text: 'No cortes las esquinas', type: 'dont' },
      { text: 'No utilices fotografías borrosas', type: 'dont' },
    ],
    icon: '🪪',
  },
  {
    id: 'license',
    name: 'Licencia de Conducir',
    category: 'driver',
    guide: 'COLOCA TU LICENCIA DENTRO DEL MARCO',
    tips: [
      { text: 'Licencia completa y vigente', type: 'do' },
      { text: 'Información clara y legible', type: 'do' },
      { text: 'Buena iluminación', type: 'do' },
      { text: 'Evita reflejos', type: 'dont' },
      { text: 'No utilices copias borrosas', type: 'dont' },
    ],
    icon: '📋',
  },
  {
    id: 'medical_certificate',
    name: 'Certificado Médico',
    category: 'driver',
    guide: 'COLOCA EL CERTIFICADO DENTRO DEL MARCO',
    tips: [
      { text: 'Certificado completo', type: 'do' },
      { text: 'Sello y firma visibles', type: 'do' },
      { text: 'Fecha de emisión clara', type: 'do' },
      { text: 'Evita documentos dañados', type: 'dont' },
    ],
    icon: '🏥',
  },
  {
    id: 'driver_photo',
    name: 'Fotografía del Conductor',
    category: 'photo',
    guide: 'COLOCA TU ROSTRO DENTRO DEL MARCO',
    tips: [
      { text: 'Rostro visible', type: 'do' },
      { text: 'Buena iluminación', type: 'do' },
      { text: 'Imagen enfocada', type: 'do' },
      { text: 'Sin obstrucciones importantes', type: 'dont' },
      { text: 'No usar filtros', type: 'dont' },
    ],
    icon: '📸',
  },
  {
    id: 'vehicle_photo_front',
    name: 'Foto Frontal del Vehículo',
    category: 'vehicle',
    guide: 'POSICIONA EL VEHÍCULO COMO SE MUESTRA',
    tips: [
      { text: 'Vehículo completo en el marco', type: 'do' },
      { text: 'Buena iluminación', type: 'do' },
      { text: 'Placa visible', type: 'do' },
      { text: 'Evita objetos que obstruyan', type: 'dont' },
    ],
    icon: '🚗',
  },
  {
    id: 'vehicle_photo_back',
    name: 'Foto Trasera del Vehículo',
    category: 'vehicle',
    guide: 'POSICIONA LA PARTE TRASERA DEL VEHÍCULO',
    tips: [
      { text: 'Vehículo completo visible', type: 'do' },
      { text: 'Placa trasera visible', type: 'do' },
      { text: 'Buena iluminación', type: 'do' },
      { text: 'Evita reflejos excesivos', type: 'dont' },
    ],
    icon: '🚗',
  },
  {
    id: 'vehicle_photo_side',
    name: 'Foto Lateral del Vehículo',
    category: 'vehicle',
    guide: 'MUESTRA EL VEHÍCULO DE LADO COMPLETO',
    tips: [
      { text: 'Vehículo completo de lado', type: 'do' },
      { text: 'Color y marca visibles', type: 'do' },
      { text: 'Buena iluminación', type: 'do' },
      { text: 'Evita cortar el vehículo', type: 'dont' },
    ],
    icon: '🚗',
  },
  {
    id: 'helmet_conductor',
    name: 'Casco del Conductor',
    category: 'helmet',
    guide: 'MUESTRA EL CASCO COMPLETO',
    tips: [
      { text: 'Casco completo visible', type: 'do' },
      { text: 'Estado general visible', type: 'do' },
      { text: 'Características identificables', type: 'do' },
      { text: 'Evita fotos borrosas', type: 'dont' },
    ],
    icon: '⛑️',
  },
  {
    id: 'helmet_passenger',
    name: 'Casco para el Pasajero',
    category: 'helmet',
    guide: 'MUESTRA EL CASCO DESTINADO AL PASAJERO',
    tips: [
      { text: 'Casco completo visible', type: 'do' },
      { text: 'En buen estado', type: 'do' },
      { text: 'Buena iluminación', type: 'do' },
      { text: 'Evita cascos dañados', type: 'dont' },
    ],
    icon: '⛑️',
  },
]

export default function DocumentCapturePage() {
  const { user } = useAuth()
  const [selectedDoc, setSelectedDoc] = useState<DocumentConfig | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCapture = (doc: DocumentConfig) => {
    setSelectedDoc(doc)
    setCapturedImage(null)
    setUploadSuccess(false)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedDoc || !capturedImage) return

    setIsUploading(true)

    try {
      // Simulate upload - in production, upload to S3
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: selectedDoc.id,
          fileName: `${selectedDoc.id}_${Date.now()}.jpg`,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setUploadSuccess(true)
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const categories = [
    { id: 'identification', name: 'Identificación', icon: '🪪' },
    { id: 'driver', name: 'Conductor', icon: '🏍️' },
    { id: 'vehicle', name: 'Vehículo', icon: '🚗' },
    { id: 'helmet', name: 'Cascos', icon: '⛑️' },
    { id: 'photo', name: 'Fotografía', icon: '📸' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
              R
            </div>
            <span className="font-bold text-gray-900">Mi Documentación</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!selectedDoc ? (
          <>
            <h1 className="mb-6 text-2xl font-bold text-gray-900">
              Documentos Requeridos
            </h1>
            <p className="mb-8 text-gray-600">
              Selecciona un documento para capturarlo. Asegúrate de seguir las guías para una correcta verificación.
            </p>

            {categories.map((category) => (
              <div key={category.id} className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  {category.icon} {category.name}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {documentConfigs
                    .filter((doc) => doc.category === category.id)
                    .map((doc) => (
                      <Card
                        key={doc.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleCapture(doc)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{doc.icon}</div>
                            <div>
                              <h3 className="font-medium text-gray-900">{doc.name}</h3>
                              <p className="text-sm text-gray-500">Toca para capturar</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="mx-auto max-w-lg">
            <Button
              variant="ghost"
              onClick={() => setSelectedDoc(null)}
              className="mb-4"
            >
              ← Volver
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  {selectedDoc.icon} {selectedDoc.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Guide Frame */}
                <div className="relative rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8">
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-700">
                      {selectedDoc.guide}
                    </p>
                  </div>

                  {capturedImage ? (
                    <img
                      src={capturedImage}
                      alt="Captura del documento"
                      className="mt-4 rounded-lg"
                    />
                  ) : (
                    <div className="mt-4 flex h-48 items-center justify-center rounded-lg border border-gray-200 bg-white">
                      <div className="text-center text-gray-400">
                        <div className="text-4xl">📷</div>
                        <p className="mt-2 text-sm">Vista previa de la captura</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tips */}
                <div className="grid grid-cols-2 gap-2">
                  {selectedDoc.tips.map((tip, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 rounded-lg p-2 text-sm ${
                        tip.type === 'do'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      <span>{tip.type === 'do' ? '✓' : '✕'}</span>
                      <span>{tip.text}</span>
                    </div>
                  ))}
                </div>

                {/* Capture Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                {!capturedImage ? (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📷 Tomar Fotografía
                  </Button>
                ) : (
                  <div className="space-y-2">
                    {uploadSuccess ? (
                      <div className="rounded-lg bg-green-50 p-4 text-center text-green-700">
                        <p className="font-medium">Documento enviado correctamente</p>
                        <p className="text-sm">Pending review por nuestro equipo</p>
                      </div>
                    ) : (
                      <>
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={handleUpload}
                          isLoading={isUploading}
                        >
                          Enviar Documento
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setCapturedImage(null)}
                        >
                          Tomar Nuevamente
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* Quality Warning */}
                <div className="rounded-lg bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-700">
                    <strong>⚠️ Nota:</strong> La validación de calidad es automática.
                    La autenticidad del documento es verificada por nuestro equipo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
