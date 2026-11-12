import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ValidationError } from '../src/services/errors.ts'
import { parseLimit } from '../src/http/limit.ts'

test('parseLimit uses the default when absent and caps at the maximum', () => {
  assert.equal(parseLimit(null, 20, 100), 20)
  assert.equal(parseLimit('5', 20, 100), 5)
  assert.equal(parseLimit('500', 20, 100), 100)
})

test('parseLimit rejects zero, negative, fractional and non-numeric values with a 400', () => {
  for (const raw of ['0', '-1', '1.5', 'abc', '', ' ', 'NaN', 'Infinity']) {
    assert.throws(() => parseLimit(raw, 20, 100), (e) => e instanceof ValidationError && e.status === 400, raw)
  }
})
