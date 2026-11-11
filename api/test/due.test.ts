import { test } from 'node:test'
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

test('a task due today counts as due today', (t) => {
  // Pin the clock used by the default `at`, so the result depends neither on
  // the wall clock (midnight rollover) nor on a FAKE_NOW set in the environment.
  const previous = process.env.FAKE_NOW
  t.after(() => {
    if (previous === undefined) delete process.env.FAKE_NOW
    else process.env.FAKE_NOW = previous
  })
  process.env.FAKE_NOW = new Date(2026, 0, 5, 12).toISOString()
  assert.equal(isDueToday({ dueDate: '2026-01-05' }), true)
  assert.equal(isDueToday({ dueDate: '2026-01-06' }), false)
})
