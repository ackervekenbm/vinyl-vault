import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewsButton, ViewsPanel } from './ViewsMenu'
import { DEFAULT_FILTERS } from '../utils/collection'
import { MAX_SAVED_VIEWS, createSavedView, type SavedView } from '../utils/views'

const singles = createSavedView(
  '7-inch singles',
  '',
  { ...DEFAULT_FILTERS, format: 'Single', yearMin: 1960, yearMax: 1969 },
  'singles',
)
const techno = createSavedView('90s techno', 'berlin', { ...DEFAULT_FILTERS, genre: 'Electronic' }, 'techno')
const initialViews = [singles, techno]

function spyProps() {
  return {
    onApply: vi.fn(),
    onClear: vi.fn(),
    onSave: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    onUpdate: vi.fn(),
    onClose: vi.fn(),
  }
}

function Harness({
  views = initialViews,
  activeView = null,
  dirty = false,
  canSave = true,
  spies,
}: {
  views?: SavedView[]
  activeView?: SavedView | null
  dirty?: boolean
  canSave?: boolean
  spies: ReturnType<typeof spyProps>
}) {
  const [list, setList] = useState(views)
  return (
    <div>
      <button type="button">outside</button>
      <ViewsPanel
        views={list}
        counts={{ singles: 42, techno: 0 }}
        folderTotal={1234}
        activeView={activeView}
        dirty={dirty}
        canSave={canSave}
        onApply={spies.onApply}
        onClear={spies.onClear}
        onSave={(name) => {
          spies.onSave(name)
          setList((prev) => [...prev, createSavedView(name, '', DEFAULT_FILTERS)])
        }}
        onRename={(id, name) => {
          spies.onRename(id, name)
          setList((prev) => prev.map((view) => (view.id === id ? { ...view, name } : view)))
        }}
        onDelete={(id) => {
          spies.onDelete(id)
          setList((prev) => prev.filter((view) => view.id !== id))
        }}
        onUpdate={spies.onUpdate}
        onClose={spies.onClose}
      />
    </div>
  )
}

const viewRow = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) })

describe('ViewsButton', () => {
  it('badges the number of saved views', () => {
    const { rerender } = render(
      <ViewsButton views={[]} activeView={null} dirty={false} open={false} onToggle={vi.fn()} />,
    )
    expect(screen.queryByText('2')).toBeNull()

    rerender(
      <ViewsButton
        views={initialViews}
        activeView={null}
        dirty={false}
        open={false}
        onToggle={vi.fn()}
      />,
    )
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Saved views' })).toBeInTheDocument()
  })

  it('names the view in use and flags it when it was changed since saving', () => {
    const { rerender } = render(
      <ViewsButton views={initialViews} activeView={singles} dirty={false} open onToggle={vi.fn()} />,
    )
    const button = screen.getByRole('button', { name: 'Saved views — 7-inch singles in use' })
    expect(button).toHaveClass('views-toggle', 'open')
    expect(button).not.toHaveClass('edited')
    expect(button).toHaveTextContent('7-inch singles')

    rerender(
      <ViewsButton views={initialViews} activeView={singles} dirty open={false} onToggle={vi.fn()} />,
    )
    expect(
      screen.getByRole('button', {
        name: 'Saved views — 7-inch singles in use, changed since saving',
      }),
    ).toHaveClass('edited')
  })

  it('toggles when pressed', async () => {
    const onToggle = vi.fn()
    render(<ViewsButton views={initialViews} activeView={null} dirty={false} open={false} onToggle={onToggle} />)
    await userEvent.click(screen.getByRole('button', { name: 'Saved views' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})

describe('ViewsPanel', () => {
  it('lists each view with a readable summary and its live match count', () => {
    render(<Harness spies={spyProps()} />)

    expect(viewRow('7-inch singles')).toHaveTextContent('Format: Single · 1960–1969')
    expect(viewRow('90s techno')).toHaveTextContent('“berlin” · Genre: Electronic')

    const singlesRow = viewRow('7-inch singles').closest('li') as HTMLElement
    expect(within(singlesRow).getByText('42')).toBeInTheDocument()
    // A view nothing matches left is still shown, with an honest zero.
    const technoRow = viewRow('90s techno').closest('li') as HTMLElement
    expect(within(technoRow).getByText('0')).toBeInTheDocument()
  })

  it('marks the active view as current and offers All releases when nothing is selected', async () => {
    const spies = spyProps()
    const { rerender } = render(<Harness spies={spies} canSave={false} />)

    expect(viewRow('All releases')).toHaveAttribute('aria-current', 'true')
    expect(screen.getByText('1,234')).toBeInTheDocument()
    await userEvent.click(viewRow('All releases'))
    expect(spies.onClear).toHaveBeenCalledTimes(1)

    rerender(<Harness spies={spies} activeView={singles} />)
    expect(viewRow('7-inch singles')).toHaveAttribute('aria-current', 'true')
    expect(viewRow('All releases')).not.toHaveAttribute('aria-current')
  })

  it('claims no view is current while hand-picked filters are on screen', () => {
    render(<Harness spies={spyProps()} canSave />)
    expect(viewRow('All releases')).not.toHaveAttribute('aria-current')
    expect(viewRow('7-inch singles')).not.toHaveAttribute('aria-current')
  })

  it('applies the view that was clicked', async () => {
    const spies = spyProps()
    render(<Harness spies={spies} />)
    await userEvent.click(viewRow('90s techno'))
    expect(spies.onApply).toHaveBeenCalledWith(techno)
  })

  it('saves the current selection under a name', async () => {
    const spies = spyProps()
    render(<Harness spies={spies} />)

    const input = screen.getByLabelText('Save the current search & filters as a view')
    const save = screen.getByRole('button', { name: 'Save' })
    expect(save).toBeDisabled()

    await userEvent.type(input, '  Warm jazz  ')
    expect(save).toBeEnabled()
    await userEvent.click(save)

    expect(spies.onSave).toHaveBeenCalledWith('Warm jazz')
    expect(input).toHaveValue('')
  })

  it('refuses to save while nothing is selected', async () => {
    const spies = spyProps()
    render(<Harness spies={spies} canSave={false} />)
    const input = screen.getByLabelText('Save the current search & filters as a view')

    await userEvent.type(input, 'Anything')

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(
      screen.getByText('Set a search or filter first, then save it here as a view.'),
    ).toBeInTheDocument()
  })

  it('refuses a duplicate name', async () => {
    const spies = spyProps()
    render(<Harness spies={spies} />)
    await userEvent.type(
      screen.getByLabelText('Save the current search & filters as a view'),
      '90s TECHNO',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(spies.onSave).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'You already have a view called “90s TECHNO”.',
    )
  })

  it('renames a view', async () => {
    const spies = spyProps()
    render(<Harness spies={spies} />)

    await userEvent.click(screen.getByRole('button', { name: 'Rename 90s techno' }))
    const input = screen.getByLabelText('Rename 90s techno')
    expect(input).toHaveValue('90s techno')
    await userEvent.clear(input)
    await userEvent.type(input, 'Berlin techno{Enter}')

    expect(spies.onRename).toHaveBeenCalledWith('techno', 'Berlin techno')
    expect(screen.queryByLabelText('Rename 90s techno')).toBeNull()
  })

  it('cancels a rename with Escape without saving', async () => {
    const spies = spyProps()
    render(<Harness spies={spies} />)

    await userEvent.click(screen.getByRole('button', { name: 'Rename 7-inch singles' }))
    await userEvent.type(screen.getByLabelText('Rename 7-inch singles'), '!')
    await userEvent.keyboard('{Escape}')

    expect(spies.onRename).not.toHaveBeenCalled()
    expect(viewRow('7-inch singles')).toBeInTheDocument()
  })

  it('confirms before deleting, and can be called off', async () => {
    const spies = spyProps()
    render(<Harness spies={spies} />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete 7-inch singles' }))
    expect(screen.getByText('Delete “7-inch singles”?')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Keep' }))
    expect(spies.onDelete).not.toHaveBeenCalled()
    expect(viewRow('7-inch singles')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Delete 7-inch singles' }))
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(spies.onDelete).toHaveBeenCalledWith('singles')
    expect(screen.queryByRole('button', { name: /7-inch singles/ })).toBeNull()
  })

  it('offers to update or revert a view that no longer matches the screen', async () => {
    const spies = spyProps()
    render(<Harness spies={spies} activeView={singles} dirty />)

    expect(screen.getByText('“7-inch singles” no longer matches what you see.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Revert' }))
    expect(spies.onApply).toHaveBeenCalledWith(singles)

    await userEvent.click(screen.getByRole('button', { name: 'Update view' }))
    expect(spies.onUpdate).toHaveBeenCalledWith(singles)
  })

  it('says nothing about changes while the view still matches', () => {
    render(<Harness spies={spyProps()} activeView={singles} dirty={false} />)
    expect(screen.queryByText(/no longer matches/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Update view' })).toBeNull()
  })

  it('caps how many views can be saved', () => {
    const many = Array.from({ length: MAX_SAVED_VIEWS }, (_, i) =>
      createSavedView(`View ${i}`, '', DEFAULT_FILTERS, `id-${i}`),
    )
    render(<Harness spies={spyProps()} views={many} />)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByLabelText('Save the current search & filters as a view')).toBeDisabled()
    expect(screen.getByText(`That's the maximum of ${MAX_SAVED_VIEWS} views — delete one to save another.`)).toBeInTheDocument()
  })

  it('closes on Escape and on a click outside, but not from inside', async () => {
    const spies = spyProps()
    render(<Harness spies={spies} />)

    await userEvent.click(viewRow('90s techno'))
    expect(spies.onClose).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'outside' }))
    expect(spies.onClose).toHaveBeenCalledTimes(1)

    await userEvent.keyboard('{Escape}')
    expect(spies.onClose).toHaveBeenCalledTimes(2)
  })
})