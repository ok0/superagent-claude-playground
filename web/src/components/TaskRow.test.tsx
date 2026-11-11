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

  it('flags a past due date that is not done as overdue', () => {
    render(
      <ul>
        <TaskRow task={task('task-1', { dueDate: '2024-01-01' })} now={new Date(2024, 0, 2)} />
      </ul>,
    )
    const row = screen.getByRole('listitem')
    expect(row.textContent).toContain('Overdue')
    expect(row.className).toContain('task-row-overdue')
  })

  it('does not flag tasks due today, done tasks or tasks without a due date', () => {
    const now = new Date(2024, 0, 2)
    render(
      <ul>
        <TaskRow task={task('a', { dueDate: '2024-01-02' })} now={now} />
        <TaskRow task={task('b', { dueDate: '2024-01-01', status: 'done' })} now={now} />
        <TaskRow task={task('c', { dueDate: null })} now={now} />
      </ul>,
    )
    expect(screen.queryByText('Overdue')).toBeNull()
  })
})
