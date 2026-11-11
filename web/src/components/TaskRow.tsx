import { isOverdue } from '../due.ts'
import type { Task } from '../types.ts'
import { StatusBadge } from './StatusBadge.tsx'

export interface TaskRowProps {
  task: Task
  now?: Date
}

export function TaskRow({ task, now }: TaskRowProps) {
  const overdue = isOverdue(task, now)
  return (
    <li className={overdue ? 'task-row task-row-overdue' : 'task-row'}>
      <span className="task-title">{task.title}</span>
      <StatusBadge status={task.status} />
      <span className="task-due">{task.dueDate === null ? 'No due date' : 'Due ' + task.dueDate}</span>
      {overdue ? <span className="overdue-badge">Overdue</span> : null}
    </li>
  )
}
