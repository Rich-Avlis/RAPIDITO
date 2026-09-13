export type UserRole = 'PASSENGER' | 'DRIVER' | 'ADMIN' | 'SUPPORT' | 'DOCUMENT_VERIFIER' | 'SUPER_ADMIN'

export type RideStatus =
  | 'REQUESTED'
  | 'SEARCHING_DRIVER'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_EN_ROUTE'
  | 'DRIVER_ARRIVED'
  | 'TRIP_STARTED'
  | 'TRIP_COMPLETED'
  | 'PAYMENT_PENDING'
  | 'COMPLETED'
  | 'CANCELLED'

export type NegotiationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'EXPIRED' | 'CANCELLED'

export type PaymentMethod = 'CASH' | 'PAGOMOVIL'
export type PaymentStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED'

export type DocumentStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'SUSPENDED'

export type DriverOnlineStatus = 'OFFLINE' | 'ONLINE' | 'BUSY'

export type WalletTransactionType = 'RIDE_EARNING' | 'COMMISSION' | 'WITHDRAWAL' | 'BONUS' | 'REFUND'

export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'REJECTED' | 'CANCELLED'

export type LoyaltyLevelName = 'BRONZE' | 'SILVER' | 'GOLD' | 'PREMIUM'

export interface Coordinates {
  lat: number
  lng: number
}

export interface Location {
  address: string
  coordinates: Coordinates
}

export interface RideRequest {
  origin: Location
  destination: Location
  estimatedFare: number
  vehicleTypeId?: string
}

export interface RideOffer {
  rideId: string
  passengerId: string
  origin: Location
  destination: Location
  estimatedFare: number
  distance: number
  duration: number
}

export interface NegotiationOffer {
  rideId: string
  offeredFare: number
}

export interface DriverLocation {
  driverId: string
  lat: number
  lng: number
  bearing?: number
  speed?: number
  timestamp: number
}

export interface MapRoute {
  distance: number // km
  duration: number // minutes
  geometry: any
}

export interface FareCalculation {
  baseFare: number
  distanceFare: number
  timeFare: number
  zoneMultiplier: number
  demandMultiplier: number
  nightMultiplier: number
  discount: number
  total: number
  minimum: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
