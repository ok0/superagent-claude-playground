import { TASK_STATUSES } from '../types.ts'
import type { Task, TaskStatus } from '../types.ts'
import { STATUS_LABELS, StatusBadge } from './StatusBadge.tsx'

export interface TaskRowProps {
  task: Task
  onStatusChange?: (id: string, status: TaskStatus) => void
}

export function TaskRow({ task, onStatusChange }: TaskRowProps) {
  return (
    <li className="task-row">
      <span className="task-title">{task.title}</span>
      <StatusBadge status={task.status} />
      {onStatusChange && (
        <select
          aria-label={'Change status of ' + task.title}
          value={task.status}
          onChange={e => onStatusChange(task.id, e.target.value as TaskStatus)}
        >
          {TASK_STATUSES.map(s => (
            <option key={s} value={s} disabled={task.status === 'done' && s === 'todo'}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      )}
      <span className="task-due">{task.dueDate === null ? 'No due date' : 'Due ' + task.dueDate}</span>
    </li>
  )
}
