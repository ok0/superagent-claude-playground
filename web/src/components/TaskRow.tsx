import type { Task } from '../types.ts'
import { StatusBadge } from './StatusBadge.tsx'

export interface TaskRowProps {
  task: Task
  /** Current time; injectable for tests. */
  now?: Date
}

function dayKey(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Mirrors the API's isOverdue: open task whose due day is before today.
export function isOverdue(task: Pick<Task, 'dueDate' | 'status'>, at: Date = new Date()): boolean {
  return task.status !== 'done' && task.dueDate !== null && task.dueDate < dayKey(at)
}

export function TaskRow({ task, now }: TaskRowProps) {
  const overdue = isOverdue(task, now)
  return (
    <li className={overdue ? 'task-row task-row-overdue' : 'task-row'}>
      <span className="task-title">{task.title}</span>
      <StatusBadge status={task.status} />
      <span className="task-due">{task.dueDate === null ? 'No due date' : 'Due ' + task.dueDate}</span>
      {overdue && <span className="overdue-label">Overdue</span>}
    </li>
  )
}
