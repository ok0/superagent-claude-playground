import { now } from '../config/clock.ts'
import { canChangeStatus, canModify } from '../auth/roles.ts'
import type { TaskStore } from '../store/memory-store.ts'
import { createIdGenerator } from '../store/ids.ts'
import type { Task } from '../store/types.ts'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from './errors.ts'
import { parseStatus, validateNewTask } from './validation.ts'

export interface TaskPage {
  items: Task[]
  next: number | null
}

export interface TaskService {
  create(input: unknown, ownerId: string): Task
  get(id: string): Task
  list(o: { start: number; limit: number }): TaskPage
  remove(id: string, userId: string): void
  listAssigned(userId: string, o: { start: number; limit: number }): TaskPage
  setStatus(id: string, status: unknown, userId: string): Task
  setAssignee(id: string, assigneeId: unknown, userId: string): Task
}

export function createTaskService(deps: { store: TaskStore; nextId?: () => string; now?: () => Date; members?: ReadonlySet<string> }): TaskService {
  const store = deps.store
  const nextId = deps.nextId ?? createIdGenerator()
  const clock = deps.now ?? now
  const members = deps.members ?? new Set<string>()
  return {
    create(input, ownerId) {
      const draft = validateNewTask(input)
      const stamp = clock().toISOString()
      return store.insert({
        id: nextId(),
        title: draft.title,
        status: draft.status ?? 'todo',
        dueDate: draft.dueDate ?? null,
        ownerId,
        assigneeId: null,
        createdAt: stamp,
        updatedAt: stamp,
      })
    },
    get(id) {
      const task = store.get(id)
      if (!task) throw new NotFoundError('task not found')
      return task
    },
    list(o) {
      const last = store.lastIndex()
      const end = Math.min(o.start + o.limit, last)
      const items = store.all().slice(o.start, end)
      return { items, next: end < last ? end : null }
    },
    remove(id, userId) {
      const task = store.get(id)
      if (!task) throw new NotFoundError('task not found')
      if (!canModify(task, userId)) throw new ForbiddenError('not allowed to delete this task')
      store.remove(id)
    },
    listAssigned(userId, o) {
      const mine = store.all().filter((t) => t.assigneeId === userId)
      const end = Math.min(o.start + o.limit, mine.length)
      return { items: mine.slice(o.start, end), next: end < mine.length ? end : null }
    },
    setStatus(id, status, userId) {
      const task = store.get(id)
      if (!task) throw new NotFoundError('task not found')
      if (!canChangeStatus(task, userId)) throw new ForbiddenError('not allowed to change this task')
      return store.replace({ ...task, status: parseStatus(status), updatedAt: clock().toISOString() })
    },
    setAssignee(id, assigneeId, userId) {
      const task = store.get(id)
      if (!task) throw new NotFoundError('task not found')
      if (!canModify(task, userId)) throw new ForbiddenError('not allowed to assign this task')
      if (assigneeId !== null && typeof assigneeId !== 'string') {
        throw new ValidationError('assigneeId must be a string or null')
      }
      if (assigneeId !== null && !members.has(assigneeId)) {
        throw new ValidationError('assignee is not a team member')
      }
      if (task.status === 'done') throw new ConflictError('a completed task cannot be reassigned')
      return store.replace({ ...task, assigneeId, updatedAt: clock().toISOString() })
    },
  }
}
