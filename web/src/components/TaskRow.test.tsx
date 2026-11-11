import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { Task } from '../types.ts'
import { TaskRow } from './TaskRow.tsx'

const task = (id: string, over: Partial<Task> = {}): Task => ({
  id,
  title: 'Task ' + id,
  status: 'todo',
  dueDate: null,
  ownerId: 'alice',
  createdAt: '2000-01-01T00:00:00.000Z',
  updatedAt: '2000-01-01T00:00:00.000Z',
  ...over,
})

afterEach(() => cleanup())

describe('TaskRow', () => {
  it('shows title, status and due date', () => {
    render(
      <ul>
        <TaskRow task={task('task-1', { title: 'Write docs', status: 'doing', dueDate: '2999-12-31' })} />
      </ul>,
    )
    const row = screen.getByRole('listitem')
    expect(row.textContent).toContain('Write docs')
    expect(row.textContent).toContain('In progress')
    expect(row.textContent).toContain('Due 2999-12-31')
  })

  it('shows when there is no due date', () => {
    render(
      <ul>
        <TaskRow task={task('task-1', { dueDate: null })} />
      </ul>,
    )
    expect(screen.getByRole('listitem').textContent).toContain('No due date')
  })

  it('flags a past-due task that is not done as overdue', () => {
    render(
      <ul>
        <TaskRow task={task('task-1', { dueDate: '2000-01-01' })} />
      </ul>,
    )
    const row = screen.getByRole('listitem')
    expect(row.className).toContain('task-row-overdue')
    expect(row.textContent).toContain('Overdue')
  })

  it('does not flag done, future or undated tasks', () => {
    render(
      <ul>
        <TaskRow task={task('a', { dueDate: '2000-01-01', status: 'done' })} />
        <TaskRow task={task('b', { dueDate: '2999-12-31' })} />
        <TaskRow task={task('c', { dueDate: null })} />
      </ul>,
    )
    for (const row of screen.getAllByRole('listitem')) {
      expect(row.className).not.toContain('task-row-overdue')
      expect(row.textContent).not.toContain('Overdue')
    }
  })
})
