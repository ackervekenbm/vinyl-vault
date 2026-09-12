import { activeFilterCount, type Filters } from '../utils/collection'
import { FilterIcon } from './icons'

interface FilterMenuProps {
  filters: Filters
  formats: string[]
  genres: string[]
  styles: string[]
  labels: string[]
  bounds: { min: number; max: number } | null
  onChange: (patch: Partial<Filters>) => void
  onReset: () => void
}

export function FiltersButton({
  filters,
  open,
  onToggle,
}: {
  filters: Filters
  open: boolean
  onToggle: () => void
}) {
  const count = activeFilterCount(filters)

  return (
    <button
      type="button"
      className={`filter-toggle${open ? ' open' : ''}`}
      onClick={onToggle}
      aria-expanded={open}
      aria-label="Filter the collection"
    >
      <FilterIcon />
      <span>Filters</span>
      {count > 0 && <span className="filter-count">{count}</span>}
    </button>
  )
}

export function FilterPanel({
  filters,
  formats,
  genres,
  styles,
  labels,
  bounds,
  onChange,
  onReset,
}: FilterMenuProps) {
  const select = (key: keyof Filters, title: string, options: string[], allLabel: string) => (
    <div className="filter-field">
      <span className="filter-field-title">{title}</span>
      <select
        value={filters[key] as string}
        onChange={(e) => onChange({ [key]: e.target.value } as Partial<Filters>)}
      >
        <option value="">{allLabel}</option>
        {options.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  )

  const onYearChange =
    (key: 'yearMin' | 'yearMax') => (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value.trim()
      const value = raw === '' ? null : Number(raw)
      onChange({ [key]: value !== null && Number.isFinite(value) ? value : null })
    }

  return (
    <div className="filter-panel">
      <div className="filter-panel-head">
        <span className="filter-panel-title">Filters</span>
        <button
          type="button"
          className="filter-reset"
          onClick={onReset}
          disabled={activeFilterCount(filters) === 0}
        >
          Reset
        </button>
      </div>
      <div className="filter-grid">
        {select('genre', 'Genre', genres, 'All genres')}
        {select('style', 'Style', styles, 'All styles')}
        {select('format', 'Format', formats, 'All formats')}
        {select('label', 'Label', labels, 'All labels')}

        <div className="filter-field">
          <span className="filter-field-title">Year range</span>
          <div className="filter-year-row">
            <input
              type="number"
              inputMode="numeric"
              placeholder={bounds ? String(bounds.min) : 'From'}
              min={bounds?.min}
              max={bounds?.max}
              value={filters.yearMin ?? ''}
              onChange={onYearChange('yearMin')}
              aria-label="Earliest release year"
            />
            <span className="filter-year-sep">–</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder={bounds ? String(bounds.max) : 'To'}
              min={bounds?.min}
              max={bounds?.max}
              value={filters.yearMax ?? ''}
              onChange={onYearChange('yearMax')}
              aria-label="Latest release year"
            />
          </div>
        </div>
      </div>
    </div>
  )
}