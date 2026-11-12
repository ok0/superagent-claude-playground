import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ForbiddenError, NotFoundError, ValidationError } from '../src/services/errors.ts'
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

test('update changes only the given fields and bumps updatedAt', () => {
  const later = new Date('2026-01-06T10:00:00.000Z')
  const store = createMemoryStore()
  const service = createTaskService({ store, nextId: createIdGenerator(), now: () => at })
  service.create({ title: 'old', dueDate: '2026-02-01' }, 'alice')
  const updater = createTaskService({ store, now: () => later })
  const updated = updater.update('task-1', { status: 'done', title: '  new  ' }, 'alice')
  assert.equal(updated.title, 'new')
  assert.equal(updated.status, 'done')
  assert.equal(updated.dueDate, '2026-02-01')
  assert.equal(updated.createdAt, at.toISOString())
  assert.equal(updated.updatedAt, later.toISOString())
  assert.deepEqual(updater.get('task-1'), updated)
})

test('update can clear dueDate with null', () => {
  const service = makeService()
  service.create({ title: 'x', dueDate: '2026-02-01' }, 'alice')
  assert.equal(service.update('task-1', { dueDate: null }, 'alice').dueDate, null)
})

test('update rejects invalid fields without changing the task', () => {
  const service = makeService()
  service.create({ title: 'keep' }, 'alice')
  for (const bad of [{}, [], null, { title: '' }, { status: 'nope' }, { dueDate: '2026-02-30' }, { id: 'x' }]) {
    assert.throws(() => service.update('task-1', bad, 'alice'), ValidationError)
  }
  assert.equal(service.get('task-1').title, 'keep')
})

test('update on an unknown id throws NotFoundError', () => {
  assert.throws(() => makeService().update('task-404', { title: 'x' }, 'alice'), NotFoundError)
})

test('update by a non-owner throws ForbiddenError', () => {
  const service = makeService()
  service.create({ title: 'mine' }, 'alice')
  assert.throws(() => service.update('task-1', { title: 'x' }, 'bob'), ForbiddenError)
  assert.equal(service.get('task-1').title, 'mine')
})
