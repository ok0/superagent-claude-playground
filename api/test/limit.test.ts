import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ValidationError } from '../src/services/errors.ts'
import { parseLimit } from '../src/http/limit.ts'

test('parseLimit uses the default when absent and caps at the maximum', () => {
  assert.equal(parseLimit(null, 20, 100), 20)
  assert.equal(parseLimit('5', 20, 100), 5)
  assert.equal(parseLimit('500', 20, 100), 100)
})

test('parseLimit rejects zero, negative and non-whole values', () => {
  for (const bad of ['0', '-1', '1.5', 'abc', '', '2e1', ' 3']) {
    assert.throws(() => parseLimit(bad, 20, 100), ValidationError, bad)
  }
})
