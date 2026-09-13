import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import prisma from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'rapidito-secret-change-in-production'
const ACCESS_TOKEN_EXPIRES = '15m'
const REFRESH_TOKEN_EXPIRES = '7d'

export interface JwtPayload {
  userId: string
  role: string
}

// ==========================================
// PASSWORD HASHING
// ==========================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ==========================================
// JWT TOKENS
// ==========================================

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES })
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

// ==========================================
// SESSION MANAGEMENT
// ==========================================

export async function createSession(userId: string, ipAddress?: string, userAgent?: string) {
  // Get user to include role in token
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('Usuario no encontrado')

  const payload: JwtPayload = { userId, role: user.role }

  // Generate tokens
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  })

  // Store session
  await prisma.session.create({
    data: {
      userId,
      token: accessToken,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
  })

  return { accessToken, refreshToken }
}

export async function refreshAccessToken(refreshToken: string) {
  // Verify refresh token
  const payload = verifyToken(refreshToken)
  if (!payload) return null

  // Check if refresh token exists in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  })

  if (!storedToken || storedToken.expiresAt < new Date()) {
    return null
  }

  // Get user
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user || !user.isActive) return null

  // Generate new access token
  const newAccessToken = generateAccessToken({ userId: user.id, role: user.role })

  return { accessToken: newAccessToken }
}

// ==========================================
// CURRENT USER
// ==========================================

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value

    if (!token) return null

    const payload = verifyToken(token)
    if (!payload) return null

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        passengerProfile: true,
        driverProfile: {
          include: {
            vehicle: {
              include: { type: true },
            },
            wallet: true,
            documents: true,
          },
        },
      },
    })

    if (!user || !user.isActive) return null

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// ==========================================
// OTP CODES
// ==========================================

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createOtpCode(phone: string, purpose: string): Promise<string> {
  // Invalidate any existing OTP for this phone and purpose
  await prisma.otpCode.updateMany({
    where: {
      phone,
      purpose,
      isUsed: false,
    },
    data: { isUsed: true },
  })

  // Generate new code
  const code = generateOtpCode()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await prisma.otpCode.create({
    data: {
      phone,
      code,
      purpose,
      expiresAt,
    },
  })

  return code
}

export async function verifyOtpCode(
  phone: string,
  code: string,
  purpose: string
): Promise<{ valid: boolean; error?: string }> {
  // Find the OTP
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      phone,
      code,
      purpose,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!otpRecord) {
    return { valid: false, error: 'Código inválido o expirado' }
  }

  // Mark as used
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { isUsed: true },
  })

  return { valid: true }
}
