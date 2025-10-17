export function normalizeQuery(q: string) {
  return (q || '').trim()
}

export function toDOP(usd: number, rate = 59) {
  if (!Number.isFinite(usd)) return 0
  return Math.round(usd * rate)
}

export function toUSD(dop: number, rate = 59) {
  if (!Number.isFinite(dop)) return 0
  return Math.round(dop / rate)
}
