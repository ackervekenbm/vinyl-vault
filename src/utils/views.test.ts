// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 ackervekenbm

import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS, type Filters } from './collection'
import {
  MAX_SAVED_VIEWS,
  createSavedView,
  describeCriteria,
  hasCriteria,
  isSavedView,
  nameTaken,
  normalizeFilters,
  normalizeSavedView,
  sameCriteria,
} from './views'

const singles: Filters = { ...DEFAULT_FILTERS, format: 'Single', yearMin: 1960, yearMax: 1969 }

describe('createSavedView', () => {
  it('trims the name and query and snapshots the filters', () => {
    const created = createSavedView('  90s techno  ', '  berlin  ', singles)
    expect(created.name).toBe('90s techno')
    expect(created.query).toBe('berlin')
    expect(created.filters).toEqual(singles)
  })

  it('gives every view a distinct id', () => {
    const ids = new Set(
      Array.from({ length: 25 }, () => createSavedView('a', '', DEFAULT_FILTERS).id),
    )
    expect(ids.size).toBe(25)
  })
})

describe('normalizeFilters', () => {
  it('fills missing fields from the defaults', () => {
    expect(normalizeFilters(undefined)).toEqual(DEFAULT_FILTERS)
    expect(normalizeFilters({})).toEqual(DEFAULT_FILTERS)
    expect(normalizeFilters({ genre: '  Jazz  ' })).toEqual({ ...DEFAULT_FILTERS, genre: 'Jazz' })
  })

  it('coerces years and drops nonsense values', () => {
    expect(normalizeFilters({ yearMin: '1975', yearMax: null }).yearMin).toBe(1975)
    expect(normalizeFilters({ yearMin: 'nineteen', yearMax: '' }).yearMin).toBeNull()
    expect(normalizeFilters({ yearMax: '' }).yearMax).toBeNull()
    expect(normalizeFilters({ yearMin: Infinity }).yearMin).toBeNull()
  })

  it('ignores values of the wrong type', () => {
    const normalized = normalizeFilters({
      format: 7,
      genre: null,
      style: { toString: () => 'Prog' },
      label: 'Blue Note',
    })
    expect(normalized.format).toBe('')
    expect(normalized.genre).toBe('')
    expect(normalized.style).toBe('')
    expect(normalized.label).toBe('Blue Note')
  })
})

describe('isSavedView / normalizeSavedView', () => {
  it('accepts a well-formed view', () => {
    expect(isSavedView({ id: 'a', name: 'A', query: '', filters: DEFAULT_FILTERS })).toBe(true)
  })

  it('rejects anything without an id or a name', () => {
    expect(isSavedView(null)).toBe(false)
    expect(isSavedView('nope')).toBe(false)
    expect(isSavedView({ name: 'A' })).toBe(false)
    expect(isSavedView({ id: 'a' })).toBe(false)
    expect(isSavedView({ id: 'a', name: '   ' })).toBe(false)
    expect(isSavedView({ id: 3, name: 'A' })).toBe(false)
  })

  it('repairs partial payloads and drops unknown filter keys', () => {
    const view = normalizeSavedView({ id: ' a ', name: ' A ', filters: { genre: ' Jazz ', bogus: 1 } })
    expect(view).toEqual({
      id: 'a',
      name: 'A',
      query: '',
      filters: { ...DEFAULT_FILTERS, genre: 'Jazz' },
    })
    expect(normalizeSavedView({ id: 'a', name: 'A', filters: { yearMin: 1990 } })?.filters).toEqual({
      ...DEFAULT_FILTERS,
      yearMin: 1990,
    })
    expect(normalizeSavedView({ id: 'a', name: 'A', query: 42 })).toEqual({
      id: 'a',
      name: 'A',
      query: '',
      filters: DEFAULT_FILTERS,
    })
    expect(normalizeSavedView({ id: 'a', name: 'A', filters: 'garbage' })?.filters).toEqual(
      DEFAULT_FILTERS,
    )
    expect(normalizeSavedView({ name: 'A' })).toBeNull()
  })
})

describe('hasCriteria', () => {
  it('is false for an untouched selection', () => {
    expect(hasCriteria('', DEFAULT_FILTERS)).toBe(false)
    expect(hasCriteria('   ', DEFAULT_FILTERS)).toBe(false)
  })

  it('is true for a search or any single filter', () => {
    expect(hasCriteria('techno', DEFAULT_FILTERS)).toBe(true)
    expect(hasCriteria('', { ...DEFAULT_FILTERS, style: 'Techno' })).toBe(true)
    expect(hasCriteria('', { ...DEFAULT_FILTERS, yearMax: 1999 })).toBe(true)
  })
})

describe('sameCriteria', () => {
  const view = createSavedView('Singles', 'blue note', singles)

  it('matches an identical selection', () => {
    expect(sameCriteria(view, 'blue note', { ...singles })).toBe(true)
    expect(sameCriteria(view, '  blue note  ', { ...singles })).toBe(true)
  })

  it('rejects a changed query or any changed filter', () => {
    expect(sameCriteria(view, 'other', singles)).toBe(false)
    expect(sameCriteria(view, 'blue note', { ...singles, genre: 'Jazz' })).toBe(false)
    expect(sameCriteria(view, 'blue note', { ...singles, yearMin: 1970 })).toBe(false)
    expect(sameCriteria(view, 'blue note', { ...singles, yearMax: null })).toBe(false)
  })
})

describe('nameTaken', () => {
  const views = [
    createSavedView('Techno', '', DEFAULT_FILTERS, 'a'),
    createSavedView('Jazz', '', DEFAULT_FILTERS, 'b'),
  ]

  it('detects a clash regardless of case or padding', () => {
    expect(nameTaken(views, 'techno')).toBe(true)
    expect(nameTaken(views, '  TECHNO ')).toBe(true)
    expect(nameTaken(views, 'Folk')).toBe(false)
  })

  it('ignores the view being renamed', () => {
    expect(nameTaken(views, 'Techno', 'a')).toBe(false)
    expect(nameTaken(views, 'Jazz', 'a')).toBe(true)
  })

  it('treats a blank name as free', () => {
    expect(nameTaken(views, '   ')).toBe(false)
  })
})

describe('describeCriteria', () => {
  it('lists the query and every active filter in a readable order', () => {
    expect(
      describeCriteria('berlin', {
        format: '12"',
        genre: 'Electronic',
        style: 'Techno',
        label: 'Wax Trax!',
        yearMin: 1990,
        yearMax: 1999,
      }),
    ).toEqual([
      '“berlin”',
      'Format: 12"',
      'Genre: Electronic',
      'Style: Techno',
      'Label: Wax Trax!',
      '1990–1999',
    ])
  })

  it('describes open-ended year ranges', () => {
    expect(describeCriteria('', { ...DEFAULT_FILTERS, yearMin: 1970 })).toEqual(['from 1970'])
    expect(describeCriteria('', { ...DEFAULT_FILTERS, yearMax: 1970 })).toEqual(['up to 1970'])
  })

  it('is empty when nothing is selected', () => {
    expect(describeCriteria('   ', DEFAULT_FILTERS)).toEqual([])
  })
})

describe('MAX_SAVED_VIEWS', () => {
  it('caps the list at a sane size', () => {
    expect(MAX_SAVED_VIEWS).toBeGreaterThan(0)
    expect(MAX_SAVED_VIEWS).toBeLessThanOrEqual(100)
  })
})