import { test, mock, type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { dayKey, isDueToday, isOverdue } from '../src/services/due.ts'

test('dayKey formats the local calendar date', () => {
  assert.equal(dayKey(new Date(2026, 0, 5)), '2026-01-05')
})

test('isOverdue is true for an open task before today', () => {
  assert.equal(isOverdue({ dueDate: '2026-01-04', status: 'todo' }, new Date(2026, 0, 5, 12)), true)
})

test('isOverdue is false for a done task', () => {
  assert.equal(isOverdue({ dueDate: '2026-01-04', status: 'done' }, new Date(2026, 0, 5, 12)), false)
})

test('isOverdue is false when there is no due date', () => {
  assert.equal(isOverdue({ dueDate: null, status: 'todo' }, new Date(2026, 0, 5, 12)), false)
})

test('isDueToday matches only the current day', () => {
  const at = new Date(2026, 0, 5, 12)
  assert.equal(isDueToday({ dueDate: '2026-01-05' }, at), true)
  assert.equal(isDueToday({ dueDate: '2026-01-06' }, at), false)
})

function withEnv(t: TestContext, fakeNow: string | undefined): void {
  const saved = process.env.FAKE_NOW
  t.after(() => {
    if (saved === undefined) delete process.env.FAKE_NOW
    else process.env.FAKE_NOW = saved
  })
  if (fakeNow === undefined) delete process.env.FAKE_NOW
  else process.env.FAKE_NOW = fakeNow
}

test('a task due today counts as due today by the default clock', (t) => {
  // Pin the clock so the result does not depend on the real date or a FAKE_NOW in the environment.
  withEnv(t, undefined)
  mock.timers.enable({ apis: ['Date'], now: new Date(2026, 0, 5, 12) })
  t.after(() => mock.timers.reset())
  assert.equal(isDueToday({ dueDate: '2026-01-05' }), true)
  assert.equal(isDueToday({ dueDate: '2026-01-06' }), false)
})

test('the default clock honours FAKE_NOW', (t) => {
  withEnv(t, new Date(2026, 5, 1, 12).toISOString())
  assert.equal(isDueToday({ dueDate: '2026-06-01' }), true)
})
