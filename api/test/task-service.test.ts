import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ForbiddenError, NotFoundError } from '../src/services/errors.ts'
import { createTaskService } from '../src/services/task-service.ts'
import { createIdGenerator } from '../src/store/ids.ts'
import { createMemoryStore } from '../src/store/memory-store.ts'

const at = new Date('2026-01-05T10:00:00.000Z')

const makeService = () =>
  createTaskService({ store: createMemoryStore(), nextId: createIdGenerator(), now: () => at })

test('create sets defaults and sequential ids', () => {
  const service = makeService()
  const first = service.create({ title: 'first' }, 'alice')
  const second = service.create({ title: 'second' }, 'alice')
  assert.equal(first.id, 'task-1')
  assert.equal(second.id, 'task-2')
  assert.equal(first.status, 'todo')
  assert.equal(first.dueDate, null)
  assert.equal(first.ownerId, 'alice')
  assert.equal(first.createdAt, at.toISOString())
  assert.equal(first.updatedAt, at.toISOString())
})

test('get on an unknown id throws NotFoundError', () => {
  const service = makeService()
  assert.throws(() => service.get('task-404'), NotFoundError)
})

test('remove by a non-owner throws ForbiddenError', () => {
  const service = makeService()
  service.create({ title: 'mine' }, 'alice')
  assert.throws(() => service.remove('task-1', 'bob'), ForbiddenError)
})

test('list returns the first page of four tasks', () => {
  const service = makeService()
  for (const title of ['one', 'two', 'three', 'four']) {
    service.create({ title }, 'alice')
  }
  const page = service.list({ start: 0, limit: 2 })
  assert.deepEqual(page.items.map((t) => t.id), ['task-1', 'task-2'])
  assert.equal(page.next, 2)
})

test('list pages through every task, including the last', () => {
  const service = makeService()
  for (let i = 1; i <= 5; i++) service.create({ title: `t${i}` }, 'alice')
  const seen: string[] = []
  let start: number | null = 0
  while (start !== null) {
    const page: { items: { id: string }[]; next: number | null } = service.list({ start, limit: 2 })
    seen.push(...page.items.map((t) => t.id))
    start = page.next
  }
  assert.deepEqual(seen, ['task-1', 'task-2', 'task-3', 'task-4', 'task-5'])
  const all = service.list({ start: 0, limit: 20 })
  assert.equal(all.items.length, 5)
  assert.equal(all.next, null)
})
