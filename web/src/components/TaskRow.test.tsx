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

  it('flags a past-due open task as overdue', () => {
    render(
      <ul>
        <TaskRow task={task('task-1', { dueDate: '2000-01-01' })} now={new Date(2026, 10, 13)} />
      </ul>,
    )
    const row = screen.getByRole('listitem')
    expect(row.className).toContain('task-row-overdue')
    expect(row.textContent).toContain('Overdue')
  })

  it('does not flag done, today, future or undated tasks', () => {
    const at = new Date(2026, 10, 13)
    const cases = [
      { status: 'done' as const, dueDate: '2000-01-01' },
      { status: 'todo' as const, dueDate: '2026-11-13' },
      { status: 'todo' as const, dueDate: '2999-12-31' },
      { status: 'todo' as const, dueDate: null },
    ]
    for (const c of cases) {
      render(
        <ul>
          <TaskRow task={task('t', c)} now={at} />
        </ul>,
      )
      const row = screen.getByRole('listitem')
      expect(row.className).not.toContain('task-row-overdue')
      expect(row.textContent).not.toContain('Overdue')
      cleanup()
    }
  })
})
