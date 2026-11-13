export const REDACTED = '[REDACTED]'

const SENSITIVE_KEY = /authorization|token|api[-_]?key|secret|password|cookie/i
const BEARER = /\b(Bearer|Basic)\s+[^\s"',;]+/gi
const KEY_VALUE = /\b(authorization|api[-_]?token|token|api[-_]?key|secret|password)(["']?\s*[:=]\s*["']?)(?!\[REDACTED\])[^\s"',;&]+/gi

export function redactString(value: string): string {
  return value
    .replace(BEARER, (_m, scheme: string) => `${scheme} ${REDACTED}`)
    .replace(KEY_VALUE, (_m, key: string, sep: string) => `${key}${sep}${REDACTED}`)
}

export function redact(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
  if (typeof value === 'string') return redactString(value)
  if (value instanceof Error) return { name: value.name, message: redactString(value.message) }
  if (value === null || typeof value !== 'object') return value
  if (seen.has(value)) return '[Circular]'
  seen.add(value)
  if (Array.isArray(value)) return value.map((item) => redact(item, seen))
  const out: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    out[key] = SENSITIVE_KEY.test(key) ? REDACTED : redact(item, seen)
  }
  return out
}
