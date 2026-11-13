import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ConflictError, ForbiddenError, ValidationError } from '../src/services/errors.ts'
import { createTaskService } from '../src/services/task-service.ts'
import { createIdGenerator } from '../src/store/ids.ts'
import { createMemoryStore } from '../src/store/memory-store.ts'
import { AUTH_A, AUTH_B, startServer } from './helpers.ts'

const makeService = () =>
  createTaskService({
    store: createMemoryStore(),
    nextId: createIdGenerator(),
    members: new Set(['alice', 'bob', 'carol']),
  })

test('creator assigns, reassigns and unassigns', () => {
  const s = makeService()
  s.create({ title: 't' }, 'alice')
  assert.equal(s.get('task-1').assigneeId, null)
  assert.equal(s.setAssignee('task-1', 'bob', 'alice').assigneeId, 'bob')
  assert.equal(s.setAssignee('task-1', 'carol', 'alice').assigneeId, 'carol')
  assert.equal(s.setAssignee('task-1', null, 'alice').assigneeId, null)
})

test('only the creator can assign, even the assignee', () => {
  const s = makeService()
  s.create({ title: 't' }, 'alice')
  s.setAssignee('task-1', 'bob', 'alice')
  assert.throws(() => s.setAssignee('task-1', 'carol', 'bob'), ForbiddenError)
  assert.throws(() => s.remove('task-1', 'bob'), ForbiddenError)
})

test('assigning to a non-member or a non-string is rejected', () => {
  const s = makeService()
  s.create({ title: 't' }, 'alice')
  assert.throws(() => s.setAssignee('task-1', 'mallory', 'alice'), ValidationError)
  assert.throws(() => s.setAssignee('task-1', 42, 'alice'), ValidationError)
})

test('a completed task cannot be reassigned or unassigned', () => {
  const s = makeService()
  s.create({ title: 't' }, 'alice')
  s.setAssignee('task-1', 'bob', 'alice')
  s.setStatus('task-1', 'done', 'bob')
  assert.throws(() => s.setAssignee('task-1', 'carol', 'alice'), ConflictError)
  assert.throws(() => s.setAssignee('task-1', null, 'alice'), ConflictError)
  assert.equal(s.get('task-1').assigneeId, 'bob')
})

test('status can be changed by creator and assignee only', () => {
  const s = makeService()
  s.create({ title: 't' }, 'alice')
  s.setAssignee('task-1', 'bob', 'alice')
  assert.equal(s.setStatus('task-1', 'doing', 'bob').status, 'doing')
  assert.equal(s.setStatus('task-1', 'todo', 'alice').status, 'todo')
  assert.throws(() => s.setStatus('task-1', 'done', 'carol'), ForbiddenError)
  assert.throws(() => s.setStatus('task-1', 'bogus', 'bob'), ValidationError)
})

test('listAssigned returns only the caller\'s tasks, paged', () => {
  const s = makeService()
  for (const t of ['a', 'b', 'c', 'd']) s.create({ title: t }, 'alice')
  s.setAssignee('task-1', 'bob', 'alice')
  s.setAssignee('task-3', 'bob', 'alice')
  s.setAssignee('task-4', 'bob', 'alice')
  s.setAssignee('task-2', 'carol', 'alice')
  const p1 = s.listAssigned('bob', { start: 0, limit: 2 })
  assert.deepEqual(p1.items.map((t) => t.id), ['task-1', 'task-3'])
  assert.equal(p1.next, 2)
  const p2 = s.listAssigned('bob', { start: 2, limit: 2 })
  assert.deepEqual(p2.items.map((t) => t.id), ['task-4'])
  assert.equal(p2.next, null)
})

test('HTTP: assign, assignee updates status, lists, and permissions', async () => {
  const server = await startServer()
  const json = { 'content-type': 'application/json' }
  try {
    const created = await fetch(server.base + '/tasks', {
      method: 'POST', headers: { ...AUTH_A, ...json }, body: JSON.stringify({ title: 'x' }),
    })
    const { id } = (await created.json()) as { id: string }
    const assign = (headers: Record<string, string>, assigneeId: unknown) =>
      fetch(`${server.base}/tasks/${id}/assignee`, {
        method: 'PUT', headers: { ...headers, ...json }, body: JSON.stringify({ assigneeId }),
      })
    assert.equal((await assign(AUTH_B, 'bob')).status, 403)
    assert.equal((await assign(AUTH_A, 'mallory')).status, 400)
    const ok = await assign(AUTH_A, 'bob')
    assert.equal(ok.status, 200)
    assert.equal(((await ok.json()) as { assigneeId: string }).assigneeId, 'bob')

    const mine = await fetch(server.base + '/me/tasks', { headers: AUTH_B })
    assert.equal(((await mine.json()) as { items: unknown[] }).items.length, 1)
    const theirs = await fetch(server.base + '/me/tasks', { headers: AUTH_A })
    assert.equal(((await theirs.json()) as { items: unknown[] }).items.length, 0)

    const patch = await fetch(`${server.base}/tasks/${id}/status`, {
      method: 'PATCH', headers: { ...AUTH_B, ...json }, body: JSON.stringify({ status: 'done' }),
    })
    assert.equal(patch.status, 200)
    assert.equal((await assign(AUTH_A, null)).status, 409)
    const del = await fetch(`${server.base}/tasks/${id}`, { method: 'DELETE', headers: AUTH_B })
    assert.equal(del.status, 403)
  } finally {
    await server.close()
  }
})
