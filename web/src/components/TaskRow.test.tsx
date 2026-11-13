import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
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

  it('reports status changes and disables todo for done tasks', () => {
    const onChange = vi.fn()
    render(
      <ul>
        <TaskRow task={task('task-1', { status: 'done' })} onStatusChange={onChange} />
      </ul>,
    )
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect((screen.getByRole('option', { name: 'To do' }) as HTMLOptionElement).disabled).toBe(true)
    fireEvent.change(select, { target: { value: 'doing' } })
    expect(onChange).toHaveBeenCalledWith('task-1', 'doing')
  })
})
