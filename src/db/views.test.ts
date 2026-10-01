import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearViews, loadViews, saveViews } from './views'
import { DEFAULT_FILTERS } from '../utils/collection'
import { MAX_SAVED_VIEWS, createSavedView, type SavedView } from '../utils/views'

const KEY = 'vinyl-vault:views'

function view(name: string, id: string): SavedView {
  return createSavedView(name, '', DEFAULT_FILTERS, id)
}

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('views persistence', () => {
  it('round-trips views', () => {
    const views = [
      createSavedView('7-inch singles', 'blue note', { ...DEFAULT_FILTERS, format: 'Single' }),
      createSavedView('90s techno', '', { ...DEFAULT_FILTERS, genre: 'Electronic', yearMin: 1990 }),
    ]
    saveViews(views)
    expect(loadViews()).toEqual(views)
    expect(JSON.parse(localStorage.getItem(KEY) ?? '[]')).toHaveLength(2)
  })

  it('returns an empty list when nothing is saved', () => {
    expect(loadViews()).toEqual([])
  })

  it('survives a corrupted or non-list payload', () => {
    localStorage.setItem(KEY, 'not json')
    expect(loadViews()).toEqual([])

    localStorage.setItem(KEY, JSON.stringify({ views: [] }))
    expect(loadViews()).toEqual([])

    localStorage.setItem(KEY, 'null')
    expect(loadViews()).toEqual([])
  })

  it('drops malformed entries and repairs partial ones', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([view('Good', 'a'), null, 'nope', { id: 'b' }, { name: 'no id' }]),
    )
    expect(loadViews()).toEqual([view('Good', 'a')])

    localStorage.setItem(KEY, JSON.stringify([{ id: 'c', name: ' Partial ', filters: { genre: 'Jazz' } }]))
    expect(loadViews()).toEqual([
      { id: 'c', name: 'Partial', query: '', filters: { ...DEFAULT_FILTERS, genre: 'Jazz' } },
    ])
  })

  it('keeps the first of any duplicated ids', () => {
    localStorage.setItem(KEY, JSON.stringify([view('First', 'a'), view('Second', 'a')]))
    expect(loadViews()).toEqual([view('First', 'a')])
  })

  it('truncates a payload beyond the cap', () => {
    const many = Array.from({ length: MAX_SAVED_VIEWS + 10 }, (_, i) =>
      view(`View ${i}`, `id-${i}`),
    )
    saveViews(many)
    expect(loadViews()).toHaveLength(MAX_SAVED_VIEWS)
    expect(loadViews()[0].name).toBe('View 0')

    localStorage.setItem(KEY, JSON.stringify(many))
    expect(loadViews()).toHaveLength(MAX_SAVED_VIEWS)
  })

  it('clears the stored views', () => {
    saveViews([view('Gone', 'a')])
    clearViews()
    expect(loadViews()).toEqual([])
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('does not throw when storage is blocked', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'QuotaExceededError')
    })
    expect(() => saveViews([view('Nope', 'a')])).not.toThrow()
    setItem.mockRestore()

    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(() => clearViews()).not.toThrow()
    removeItem.mockRestore()

    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(loadViews()).toEqual([])
    getItem.mockRestore()
  })
})