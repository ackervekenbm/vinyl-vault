import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterPanel, FiltersButton } from './FilterMenu'
import { DEFAULT_FILTERS, type Filters } from '../utils/collection'

const noFilters = { ...DEFAULT_FILTERS }

describe('FiltersButton', () => {
  it('shows a badge counting active filters', () => {
    const { rerender } = render(
      <FiltersButton filters={noFilters} open={false} onToggle={vi.fn()} />,
    )
    expect(screen.queryByText(/[1-9]/)).toBeNull()

    rerender(
      <FiltersButton
        filters={{ ...noFilters, genre: 'Rock', style: 'Prog', yearMin: 1970 }}
        open={false}
        onToggle={vi.fn()}
      />,
    )
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})

describe('FilterPanel', () => {
  const base = {
    formats: ['LP', 'CD'],
    genres: ['Jazz', 'Rock'],
    styles: ['Prog'],
    labels: ['Vertigo'],
    bounds: { min: 1950, max: 2020 } as const,
  }

  // A stateful wrapper so controlled inputs actually accept user input.
  function PanelHarness({ onChange }: { onChange: (patch: Partial<Filters>) => void }) {
    const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS })
    return (
      <FilterPanel
        {...base}
        filters={filters}
        onChange={(patch) => {
          onChange(patch)
          setFilters((f) => ({ ...f, ...patch }))
        }}
        onReset={() => setFilters({ ...DEFAULT_FILTERS })}
      />
    )
  }

  it('emits filter changes for each dropdown', () => {
    const onChange = vi.fn()
    render(<PanelHarness onChange={onChange} />)

    const [genre, style, format, label] = screen.getAllByRole('combobox')
    fireEvent.change(genre, { target: { value: 'Jazz' } })
    expect(onChange).toHaveBeenLastCalledWith({ genre: 'Jazz' })
    fireEvent.change(style, { target: { value: 'Prog' } })
    expect(onChange).toHaveBeenLastCalledWith({ style: 'Prog' })
    fireEvent.change(format, { target: { value: 'LP' } })
    expect(onChange).toHaveBeenLastCalledWith({ format: 'LP' })
    fireEvent.change(label, { target: { value: 'Vertigo' } })
    expect(onChange).toHaveBeenLastCalledWith({ label: 'Vertigo' })
  })

  it('parses year inputs into numbers and treats empty input as cleared', async () => {
    const onChange = vi.fn()
    render(<PanelHarness onChange={onChange} />)
    const user = userEvent.setup()

    const [min, max] = screen.getAllByRole('spinbutton')
    await user.type(min, '1975')
    expect(onChange).toHaveBeenLastCalledWith({ yearMin: 1975 })
    await user.type(max, '2020')
    expect(onChange).toHaveBeenLastCalledWith({ yearMax: 2020 })
    await user.clear(min)
    expect(onChange).toHaveBeenLastCalledWith({ yearMin: null })
    await user.clear(max)
    expect(onChange).toHaveBeenLastCalledWith({ yearMax: null })
  })

  it('disables reset when no filters are active', () => {
    render(<PanelHarness onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled()
  })
})