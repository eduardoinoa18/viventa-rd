export type ProfessionalRankingInput = {
  rating?: number
  reviewsCount?: number
  salesCount?: number
  yearsExperience?: number
  emailVerified?: boolean
  identityVerified?: boolean
  hasProfessionalCode?: boolean
  hasActiveSubscription?: boolean
}

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function calculateProfessionalRankingScore(input: ProfessionalRankingInput): number {
  const rating = Math.min(Math.max(toNumber(input.rating), 0), 5)
  const reviewsCount = Math.max(toNumber(input.reviewsCount), 0)
  const salesCount = Math.max(toNumber(input.salesCount), 0)
  const yearsExperience = Math.max(toNumber(input.yearsExperience), 0)

  const ratingScore = (rating / 5) * 40
  const reviewConfidenceScore = Math.min(reviewsCount, 50) / 50 * 20
  const salesScore = Math.min(salesCount, 200) / 200 * 20
  const yearsScore = Math.min(yearsExperience, 25) / 25 * 10

  const verificationBonus =
    (input.emailVerified ? 3 : 0) +
    (input.identityVerified ? 3 : 0) +
    (input.hasProfessionalCode ? 2 : 0) +
    (input.hasActiveSubscription ? 2 : 0)

  return Number((ratingScore + reviewConfidenceScore + salesScore + yearsScore + verificationBonus).toFixed(2))
}
