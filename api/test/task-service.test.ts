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
  const creator = createTaskService({ store, nextId: createIdGenerator(), now: () => at })
  creator.create({ title: 'first', dueDate: '2026-02-01' }, 'alice')
  const service = createTaskService({ store, now: () => later })
  const updated = service.update('task-1', { status: 'done' }, 'alice')
  assert.equal(updated.status, 'done')
  assert.equal(updated.title, 'first')
  assert.equal(updated.dueDate, '2026-02-01')
  assert.equal(updated.createdAt, at.toISOString())
  assert.equal(updated.updatedAt, later.toISOString())
  assert.deepEqual(service.get('task-1'), updated)
  assert.equal(service.update('task-1', { dueDate: null }, 'alice').dueDate, null)
})

test('update on an unknown id throws NotFoundError', () => {
  assert.throws(() => makeService().update('task-404', { title: 'x' }, 'alice'), NotFoundError)
})

test('update by a non-owner throws ForbiddenError and changes nothing', () => {
  const service = makeService()
  service.create({ title: 'mine' }, 'alice')
  assert.throws(() => service.update('task-1', { title: 'hijack' }, 'bob'), ForbiddenError)
  assert.equal(service.get('task-1').title, 'mine')
})

test('update with invalid fields throws ValidationError and changes nothing', () => {
  const service = makeService()
  service.create({ title: 'mine' }, 'alice')
  for (const bad of [{}, { title: '' }, { status: 'later' }, { dueDate: '2026-02-30' }, { extra: 1 }, [], null]) {
    assert.throws(() => service.update('task-1', bad, 'alice'), ValidationError)
  }
  assert.equal(service.get('task-1').title, 'mine')
})
