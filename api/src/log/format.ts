import type { LogLevel } from '../config/index.ts'
import { redact, redactString } from './redact.ts'

export function formatLine(level: LogLevel, message: string, fields: Readonly<Record<string, unknown>>, at: Date): string {
  const safe = redact(fields) as Record<string, unknown>
  return JSON.stringify({ time: at.toISOString(), level, msg: redactString(message), ...safe })
}
