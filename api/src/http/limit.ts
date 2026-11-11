import { ValidationError } from '../services/errors.ts'

/** Parses the `limit` query value: a positive whole number, capped at `max`. */
export function parseLimit(raw: string | null, fallback: number, max: number): number {
  if (raw === null) return Math.min(fallback, max)
  if (!/^\d+$/.test(raw)) throw new ValidationError('invalid limit')
  const n = Number(raw)
  if (!Number.isSafeInteger(n) || n < 1) throw new ValidationError('invalid limit')
  return Math.min(n, max)
}
