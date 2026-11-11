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
  let current = at
  const service = createTaskService({ store: createMemoryStore(), nextId: createIdGenerator(), now: () => current })
  service.create({ title: 'orig', dueDate: '2026-02-01' }, 'alice')
  current = later
  const updated = service.update('task-1', { status: 'doing' }, 'alice')
  assert.equal(updated.status, 'doing')
  assert.equal(updated.title, 'orig')
  assert.equal(updated.dueDate, '2026-02-01')
  assert.equal(updated.createdAt, at.toISOString())
  assert.equal(updated.updatedAt, later.toISOString())
  assert.deepEqual(service.get('task-1'), updated)
})

test('update can trim the title and clear dueDate', () => {
  const service = makeService()
  service.create({ title: 'orig', dueDate: '2026-02-01' }, 'alice')
  const updated = service.update('task-1', { title: '  new  ', dueDate: null }, 'alice')
  assert.equal(updated.title, 'new')
  assert.equal(updated.dueDate, null)
})

test('update rejects invalid fields with ValidationError and leaves the task unchanged', () => {
  const service = makeService()
  const original = service.create({ title: 'orig' }, 'alice')
  for (const bad of [{ title: '' }, { status: 'nope' }, { dueDate: '2026-02-30' }, { owner: 'x' }, {}, [], null]) {
    assert.throws(() => service.update('task-1', bad, 'alice'), ValidationError)
  }
  assert.deepEqual(service.get('task-1'), original)
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
