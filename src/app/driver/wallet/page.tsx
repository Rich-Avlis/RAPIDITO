'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface Wallet {
  balance: number
  pendingBalance: number
  totalEarned: number
  totalCommission: number
  totalWithdrawn: number
  transactions: any[]
  withdrawals: any[]
}

export default function DriverWalletPage() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'withdrawals'>('overview')

  useEffect(() => {
    fetchWallet()
  }, [])

  const fetchWallet = async () => {
    try {
      const response = await fetch('/api/wallet')
      const data = await response.json()
      if (data.success) {
        setWallet(data.data.wallet)
      }
    } catch (error) {
      console.error('Error fetching wallet:', error)
    }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) return

    setIsWithdrawing(true)

    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      const data = await response.json()
      if (data.success) {
        setWithdrawAmount('')
        fetchWallet()
        alert('Solicitud de retiro enviada')
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Error withdrawing:', error)
    } finally {
      setIsWithdrawing(false)
    }
  }

  if (!wallet) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
              R
            </div>
            <span className="font-bold text-gray-900">Mi Billetera</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Balance Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">Saldo Disponible</p>
              <p className="text-3xl font-bold text-green-600">
                ${wallet.balance.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">Ganancias Brutas</p>
              <p className="text-3xl font-bold text-gray-900">
                ${wallet.totalEarned.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">Comisiones</p>
              <p className="text-3xl font-bold text-red-500">
                -${wallet.totalCommission.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">Retirado</p>
              <p className="text-3xl font-bold text-primary">
                ${wallet.totalWithdrawn.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Withdraw Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Solicitar Retiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                type="number"
                placeholder="Monto a retirar"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="5"
                step="0.01"
              />
              <Button
                onClick={handleWithdraw}
                isLoading={isWithdrawing}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) < 5}
              >
                Retirar
              </Button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Monto mínimo: $5.00 | Saldo disponible: ${wallet.balance.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            onClick={() => setActiveTab('overview')}
          >
            Resumen
          </Button>
          <Button
            variant={activeTab === 'transactions' ? 'default' : 'outline'}
            onClick={() => setActiveTab('transactions')}
          >
            Transacciones
          </Button>
          <Button
            variant={activeTab === 'withdrawals' ? 'default' : 'outline'}
            onClick={() => setActiveTab('withdrawals')}
          >
            Retiros
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'transactions' && (
          <Card>
            <CardHeader>
              <CardTitle>Historial de Transacciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wallet.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{tx.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(tx.createdAt).toLocaleDateString('es-VE')}
                      </p>
                    </div>
                    <p
                      className={`font-semibold ${
                        tx.amount >= 0 ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
                {wallet.transactions.length === 0 && (
                  <p className="py-8 text-center text-gray-500">
                    No hay transacciones aún
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'withdrawals' && (
          <Card>
            <CardHeader>
              <CardTitle>Historial de Retiros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wallet.withdrawals.map((wd) => (
                  <div
                    key={wd.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        Retiro - ${wd.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(wd.createdAt).toLocaleDateString('es-VE')}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        wd.status === 'PAID'
                          ? 'bg-green-100 text-green-700'
                          : wd.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : wd.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {wd.status}
                    </span>
                  </div>
                ))}
                {wallet.withdrawals.length === 0 && (
                  <p className="py-8 text-center text-gray-500">
                    No hay retiros registrados
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
