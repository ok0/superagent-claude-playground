import { ValidationError } from '../services/errors.ts'

/** Parses the `limit` query value; absent means the default, anything but a positive whole number is a 400. */
export function parseLimit(raw: string | null, defaultLimit: number, maxLimit: number): number {
  if (raw === null) return Math.min(defaultLimit, maxLimit)
  const n = Number(raw)
  if (raw.trim() === '' || !Number.isInteger(n) || n < 1) throw new ValidationError('invalid limit')
  return Math.min(n, maxLimit)
}
