import prisma from '@/lib/prisma'

export const FIRST_RIDE_DISCOUNT_PERCENT = 5
export const FIRST_RIDE_DISCOUNT_RIDES = 2
export const REFERRAL_DISCOUNT_PERCENT = 10
export const REFERRAL_DISCOUNT_RIDES = 2

export function applyDiscount(total: number, discountPercent: number): number {
  return Math.round(total * (1 - discountPercent / 100) * 100) / 100
}

export async function getRideDiscount(
  userId: string,
  passengerProfileId: string,
  promoCode?: string
): Promise<{ discountPercent: number; promoCode?: string }> {
  const ridesCompleted = await prisma.ride.count({
    where: { passengerId: passengerProfileId, status: 'COMPLETED' },
  })

  let discountPercent =
    ridesCompleted < FIRST_RIDE_DISCOUNT_RIDES ? FIRST_RIDE_DISCOUNT_PERCENT : 0
  let appliedPromo: string | undefined

  if (promoCode) {
    const referrer = await prisma.user.findUnique({ where: { referralCode: promoCode } })
    if (referrer && referrer.id !== userId) {
      const referral = await prisma.referral.findFirst({
        where: { referrerId: referrer.id, referredId: userId },
      })
      if (referral) {
        const promoRides = await prisma.ride.count({
          where: { passengerId: passengerProfileId, promoCode },
        })
        if (promoRides < REFERRAL_DISCOUNT_RIDES) {
          appliedPromo = promoCode
          discountPercent = Math.max(discountPercent, REFERRAL_DISCOUNT_PERCENT)
        }
      }
    }
  }

  return { discountPercent, promoCode: appliedPromo }
}
