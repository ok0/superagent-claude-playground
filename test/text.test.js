import { test } from 'node:test'
import assert from 'node:assert/strict'
import { slugify, truncate, wordCount, titleCase } from '../src/text.js'

test('titleCase upper-cases the first letter of each word', () => {
  assert.equal(titleCase('hello big world'), 'Hello Big World')
  assert.equal(titleCase('hELLO wORLD'), 'HELLO WORLD')
  assert.equal(titleCase('  a  b'), '  A  B')
})

test('titleCase handles empty text', () => {
  assert.equal(titleCase(''), '')
})

test('slugify turns words into a url slug', () => {
  assert.equal(slugify('Hello, World!'), 'hello-world')
  assert.equal(slugify('Crème brûlée'), 'creme-brulee')
})

test('truncate keeps short text', () => {
  assert.equal(truncate('hi', 5), 'hi')
})

test('truncate shortens long text with an ellipsis', () => {
  assert.equal(truncate('hello world', 6), 'hello…')
})

test('wordCount counts words', () => {
  assert.equal(wordCount('one two  three'), 3)
  assert.equal(wordCount('   '), 0)
})
