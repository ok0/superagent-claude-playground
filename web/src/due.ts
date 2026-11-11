import type { Task } from './types.ts'

function dayKey(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** A task is overdue when it is not done and its due date is before today (local time). */
export function isOverdue(task: Pick<Task, 'dueDate' | 'status'>, at: Date = new Date()): boolean {
  return task.status !== 'done' && task.dueDate !== null && task.dueDate < dayKey(at)
}
