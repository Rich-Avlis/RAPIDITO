import { z } from 'zod'

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['PASSENGER', 'DRIVER']),
})

export const loginSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  password: z.string().min(1, 'Password is required'),
})

export const otpRequestSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  purpose: z.enum(['registration', 'login', 'password_reset']),
})

export const otpVerifySchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
  purpose: z.enum(['registration', 'login', 'password_reset']),
})

export const rideRequestSchema = z.object({
  originAddress: z.string().min(1, 'Origin address is required'),
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destAddress: z.string().min(1, 'Destination address is required'),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
  estimatedFare: z.number().positive(),
  vehicleTypeId: z.string().uuid().optional(),
})

export const negotiationSchema = z.object({
  rideId: z.string().uuid(),
  offeredFare: z.number().positive(),
})

export const ratingSchema = z.object({
  rideId: z.string().uuid(),
  score: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
})

export const driverLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  bearing: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
})

export const documentUploadSchema = z.object({
  documentType: z.string().min(1),
  fileName: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
})

export const paymentSchema = z.object({
  rideId: z.string().uuid(),
  method: z.enum(['CASH', 'PAGOMOVIL']),
  pagomovilRef: z.string().optional(),
})

export const withdrawalSchema = z.object({
  amount: z.number().positive(),
  notes: z.string().max(500).optional(),
})

export const tariffConfigSchema = z.object({
  zone: z.string().min(1),
  vehicleTypeId: z.string().uuid(),
  baseFare: z.number().min(0),
  minimumFare: z.number().min(0),
  pricePerKm: z.number().min(0),
  pricePerMinute: z.number().min(0),
  zoneMultiplier: z.number().min(0),
  demandMultiplier: z.number().min(0),
  nightMultiplier: z.number().min(0),
  negotiationMin: z.number().min(0),
  negotiationMax: z.number().min(0),
})
