import { TASK_STATUSES } from '../store/types.ts'
import type { NewTask, TaskPatch, TaskStatus } from '../store/types.ts'
import { ValidationError } from './errors.ts'

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/
const NEW_TASK_KEYS = ['title', 'status', 'dueDate']

export function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_KEY.test(value)) return false
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  const day = Number(value.slice(8, 10))
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function parseStatus(value: unknown): TaskStatus {
  if (typeof value === 'string' && (TASK_STATUSES as readonly string[]).includes(value)) {
    return value as TaskStatus
  }
  throw new ValidationError('invalid status')
}

function requireObject(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new ValidationError('body must be an object')
  }
  const record = input as Record<string, unknown>
  for (const key of Object.keys(record)) {
    if (!NEW_TASK_KEYS.includes(key)) throw new ValidationError(`unknown field: ${key}`)
  }
  return record
}

function parseTitle(raw: unknown): string {
  if (typeof raw !== 'string') throw new ValidationError('title must be a string')
  const title = raw.trim()
  if (title.length < 1 || title.length > 200) throw new ValidationError('title must be 1-200 characters')
  return title
}

function parseDueDate(value: unknown): string | null {
  if (value !== null && !isDateKey(value)) {
    throw new ValidationError('dueDate must be YYYY-MM-DD or null')
  }
  return value
}

export function validateNewTask(input: unknown): NewTask {
  const record = requireObject(input)
  const draft: NewTask = { title: parseTitle(record.title) }
  if (record.status !== undefined) draft.status = parseStatus(record.status)
  if (record.dueDate !== undefined) draft.dueDate = parseDueDate(record.dueDate)
  return draft
}

export function validateTaskPatch(input: unknown): TaskPatch {
  const record = requireObject(input)
  const patch: TaskPatch = {}
  if (record.title !== undefined) patch.title = parseTitle(record.title)
  if (record.status !== undefined) patch.status = parseStatus(record.status)
  if (record.dueDate !== undefined) patch.dueDate = parseDueDate(record.dueDate)
  if (Object.keys(patch).length === 0) throw new ValidationError('at least one field is required')
  return patch
}
