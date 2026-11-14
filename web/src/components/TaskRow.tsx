import type { Task } from '../types.ts'
import { StatusBadge } from './StatusBadge.tsx'

export interface TaskRowProps {
  task: Task
}

function todayString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

export function isOverdue(task: Task, today: string = todayString()): boolean {
  return task.status !== 'done' && task.dueDate !== null && task.dueDate.slice(0, 10) < today
}

export function TaskRow({ task }: TaskRowProps) {
  const overdue = isOverdue(task)
  return (
    <li className={overdue ? 'task-row task-row-overdue' : 'task-row'}>
      <span className="task-title">{task.title}</span>
      <StatusBadge status={task.status} />
      <span className="task-due">{task.dueDate === null ? 'No due date' : 'Due ' + task.dueDate}</span>
      {overdue && <span className="badge badge-overdue">Overdue</span>}
    </li>
  )
}
