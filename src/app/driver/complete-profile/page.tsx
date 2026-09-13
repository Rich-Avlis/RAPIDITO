'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface DocumentUpload {
  type: string
  name: string
  file: File | null
  preview: string | null
  uploaded: boolean
}

export default function CompleteDriverProfile() {
  const { user } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<'vehicle' | 'documents' | 'done'>(user?.driverProfile?.vehicle ? 'documents' : 'vehicle')
  
  // Vehicle details
  const [vehicle, setVehicle] = useState({
    brand: user?.driverProfile?.vehicle?.brand || '',
    model: user?.driverProfile?.vehicle?.model || '',
    color: user?.driverProfile?.vehicle?.color || '',
    plateNumber: user?.driverProfile?.vehicle?.plateNumber || '',
    year: user?.driverProfile?.vehicle?.year?.toString() || '',
    type: 'moto',
  })

  // Documents
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    { type: 'cedula', name: 'Cédula / Documento de Identidad', file: null, preview: null, uploaded: false },
    { type: 'license', name: 'Licencia de Conducir', file: null, preview: null, uploaded: false },
    { type: 'medical_certificate', name: 'Certificado Médico', file: null, preview: null, uploaded: false },
    { type: 'vehicle_registration', name: 'Documento del Vehículo', file: null, preview: null, uploaded: false },
    { type: 'soat', name: 'Seguro (SOAT)', file: null, preview: null, uploaded: false },
    { type: 'helmet_conductor', name: 'Casco del Conductor', file: null, preview: null, uploaded: false },
    { type: 'helmet_passenger', name: 'Casco del Pasajero', file: null, preview: null, uploaded: false },
  ])

  const [isSaving, setIsSaving] = useState(false)
  const [currentDocIndex, setCurrentDocIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleVehicleSubmit = async () => {
    setIsSaving(true)
    try {
      // TODO: Update vehicle info via API
      setStep('documents')
    } catch (error) {
      console.error('Error saving vehicle:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const updatedDocs = [...documents]
      updatedDocs[currentDocIndex].file = file
      updatedDocs[currentDocIndex].preview = e.target?.result as string
      setDocuments(updatedDocs)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadDocument = async () => {
    const doc = documents[currentDocIndex]
    if (!doc.file) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: doc.type,
          fileName: doc.file.name,
        }),
      })

      const data = await response.json()
      if (data.success) {
        const updatedDocs = [...documents]
        updatedDocs[currentDocIndex].uploaded = true
        setDocuments(updatedDocs)

        if (currentDocIndex < documents.length - 1) {
          setCurrentDocIndex(currentDocIndex + 1)
        } else {
          setStep('done')
        }
      }
    } catch (error) {
      console.error('Error uploading document:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const currentDoc = documents[currentDocIndex]
  const uploadedCount = documents.filter(d => d.uploaded).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">R</div>
            <span className="font-bold text-gray-900">Completar Perfil</span>
          </div>
          <span className="text-sm text-gray-500">
            {step === 'vehicle' ? '1/2 Vehículo' : step === 'documents' ? `2/2 Documentos (${uploadedCount}/${documents.length})` : '✅ Completo'}
          </span>
        </div>
      </header>

      <main className="container mx-auto max-w-lg px-4 py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div 
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: step === 'vehicle' ? '50%' : step === 'documents' ? `${50 + (uploadedCount / documents.length) * 50}%` : '100%' }}
            />
          </div>
        </div>

        {/* Step: Vehicle Details */}
        {step === 'vehicle' && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>🏍️ Datos del Vehículo</CardTitle>
              <CardDescription>Completa la información de tu vehículo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Tipo</label>
                <select
                  value={vehicle.type}
                  onChange={(e) => setVehicle({ ...vehicle, type: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="moto">🏍️ Moto</option>
                  <option value="car">🚗 Automóvil</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Marca" placeholder="Honda" value={vehicle.brand} onChange={(e) => setVehicle({ ...vehicle, brand: e.target.value })} />
                <Input label="Modelo" placeholder="XR 150" value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Color" placeholder="Negro" value={vehicle.color} onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })} />
                <Input label="Placa" placeholder="ABC123" value={vehicle.plateNumber} onChange={(e) => setVehicle({ ...vehicle, plateNumber: e.target.value.toUpperCase() })} />
              </div>

              <Input label="Año" type="number" placeholder="2020" value={vehicle.year} onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })} />

              <Button className="w-full shadow-lg shadow-primary/30" size="lg" onClick={handleVehicleSubmit} isLoading={isSaving}>
                Continuar a Documentos →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Document Upload */}
        {step === 'documents' && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>📄 {currentDoc.name}</CardTitle>
              <CardDescription>
                Documento {currentDocIndex + 1} de {documents.length}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Document Guide */}
              <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                <p className="text-lg font-medium text-gray-700">
                  COLOCA EL DOCUMENTO DENTRO DEL MARCO
                </p>
                
                {currentDoc.preview ? (
                  <img src={currentDoc.preview} alt="Vista previa" className="mx-auto mt-4 max-h-48 rounded-lg" />
                ) : (
                  <div className="mx-auto mt-4 flex h-40 w-full max-w-xs items-center justify-center rounded-lg border border-gray-200 bg-white">
                    <span className="text-4xl">📷</span>
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-green-50 p-2 text-green-700">✓ Documento completo</div>
                <div className="rounded-lg bg-green-50 p-2 text-green-700">✓ Buena iluminación</div>
                <div className="rounded-lg bg-green-50 p-2 text-green-700">✓ Texto legible</div>
                <div className="rounded-lg bg-red-50 p-2 text-red-700">✕ Evita reflejos</div>
                <div className="rounded-lg bg-red-50 p-2 text-red-700">✕ No cortes esquinas</div>
                <div className="rounded-lg bg-red-50 p-2 text-red-700">✕ Sin fotos borrosas</div>
              </div>

              {/* Upload buttons */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                capture="environment"
                className="hidden"
              />

              {!currentDoc.preview ? (
                <Button className="w-full" size="lg" onClick={() => fileInputRef.current?.click()}>
                  📷 Tomar Fotografía
                </Button>
              ) : (
                <div className="space-y-2">
                  {currentDoc.uploaded ? (
                    <div className="rounded-lg bg-green-50 p-4 text-center text-green-700">
                      ✅ Documento enviado correctamente
                    </div>
                  ) : (
                    <>
                      <Button className="w-full" size="lg" onClick={handleUploadDocument} isLoading={isSaving}>
                        Enviar Documento
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => {
                        const updatedDocs = [...documents]
                        updatedDocs[currentDocIndex].preview = null
                        updatedDocs[currentDocIndex].file = null
                        setDocuments(updatedDocs)
                      }}>
                        Tomar Nuevamente
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Skip option */}
              {!currentDoc.uploaded && (
                <Button variant="ghost" className="w-full text-gray-500" onClick={() => {
                  if (currentDocIndex < documents.length - 1) {
                    setCurrentDocIndex(currentDocIndex + 1)
                  } else {
                    setStep('done')
                  }
                }}>
                  Completar después →
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 text-6xl">🎉</div>
              <CardTitle>¡Perfil Completado!</CardTitle>
              <CardDescription>
                {uploadedCount === documents.length
                  ? 'Todos tus documentos han sido enviados para revisión.'
                  : `Enviaste ${uploadedCount} de ${documents.length} documentos. Puedes completar el resto después.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700">
                <p className="font-medium">⏳ Requisitos para estar en línea:</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Cédula aprobada</li>
                  <li>Licencia aprobada</li>
                  <li>Certificado médico aprobado</li>
                  <li>Vehículo registrado con documentos</li>
                </ul>
              </div>

              <Button className="w-full shadow-lg shadow-primary/30" size="lg" onClick={() => router.push('/driver')}>
                Ir al Panel del Conductor →
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <div className="fixed bottom-4 left-0 right-0 text-center">
        <a href="https://asistid.net" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-primary transition-colors">
          Powered by <span className="font-semibold">Asistid</span>
        </a>
      </div>
    </div>
  )
}
