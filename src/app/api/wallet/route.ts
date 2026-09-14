import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { withdrawalSchema } from '@/lib/validations'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'DRIVER') {
      return unauthorizedResponse('Only drivers can access wallet')
    }

    const wallet = await prisma.driverWallet.findUnique({
      where: { driverId: user.driverProfile!.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        withdrawals: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!wallet) {
      // Create wallet if it doesn't exist
      const newWallet = await prisma.driverWallet.create({
        data: { driverId: user.driverProfile!.id },
      })
      return successResponse({ wallet: newWallet })
    }

    return successResponse({ wallet })
  } catch (error) {
    console.error('Get wallet error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'DRIVER') {
      return unauthorizedResponse('Only drivers can request withdrawals')
    }

    const body = await request.json()
    const validatedData = withdrawalSchema.parse(body)

    const wallet = await prisma.driverWallet.findUnique({
      where: { driverId: user.driverProfile!.id },
    })

    if (!wallet) {
      return errorResponse('Wallet not found', 404)
    }

    // Check minimum withdrawal amount
    const minWithdrawal = 10.00
    if (validatedData.amount < minWithdrawal) {
      return errorResponse(`El mínimo para retirar es $${minWithdrawal}`, 400)
    }

    // Check available balance
    if (validatedData.amount > wallet.balance) {
      return errorResponse('Saldo insuficiente', 400)
    }

    // Verify driver has registered Pago Móvil data
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
    })

    if (!driverProfile?.paymentBank || !driverProfile?.paymentPhone || !driverProfile?.paymentCedula) {
      return errorResponse('Debes registrar tus datos de Pago Móvil antes de solicitar un retiro. Ve a Mi Perfil → Datos de pago.', 400)
    }

    // Create withdrawal request
    const withdrawal = await prisma.withdrawal.create({
      data: {
        walletId: wallet.id,
        amount: validatedData.amount,
        status: 'PENDING',
        notes: validatedData.notes,
      },
    })

    // Deduct from balance (will be confirmed when processed)
    await prisma.driverWallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: validatedData.amount },
      },
    })

    // Create wallet transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        amount: -validatedData.amount,
        description: `Withdrawal request`,
      },
    })

    // TODO: Notify admin of new withdrawal request

    return successResponse({ withdrawal }, 'Withdrawal request submitted')
  } catch (error) {
    console.error('Withdrawal error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return errorResponse('Validation failed: ' + error.message, 422)
    }
    return errorResponse('Internal server error', 500)
  }
}
