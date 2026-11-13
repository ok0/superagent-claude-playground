import type { Task } from '../store/types.ts'

export function canChangeStatus(task: Pick<Task, 'ownerId' | 'assigneeId'>, userId: string): boolean {
  return task.ownerId === userId || task.assigneeId === userId
}

export function canModify(task: Pick<Task, 'ownerId'>, userId: string): boolean {
  return task.ownerId === userId
}
