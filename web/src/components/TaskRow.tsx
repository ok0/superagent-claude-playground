import type { Task } from '../types.ts'
import { isOverdue } from '../due.ts'
import { StatusBadge } from './StatusBadge.tsx'

export interface TaskRowProps {
  task: Task
}

export function TaskRow({ task }: TaskRowProps) {
  const overdue = isOverdue(task)
  return (
    <li className={overdue ? 'task-row task-row-overdue' : 'task-row'}>
      <span className="task-title">{task.title}</span>
      <StatusBadge status={task.status} />
      <span className="task-due">{task.dueDate === null ? 'No due date' : 'Due ' + task.dueDate}</span>
      {overdue && <span className="overdue-flag">Overdue</span>}
    </li>
  )
}
