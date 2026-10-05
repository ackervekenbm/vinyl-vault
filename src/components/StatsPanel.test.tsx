// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 ackervekenbm

import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatsPanel } from './StatsPanel'
import { artist, release } from '../test/factories'
import type { CollectionValueState } from '../hooks/useCollectionValue'

const idleValue = (overrides: Partial<CollectionValueState> = {}): CollectionValueState => ({
  value: null,
  fetchedAt: null,
  status: 'idle',
  error: null,
  open: vi.fn(),
  refresh: vi.fn(),
  ...overrides,
})

const basic = release().basic_information

const collection = [
  release({
    id: 1,
    instance_id: 1,
    date_added: '2021-03-04T10:00:00Z',
    basic_information: {
      ...basic,
      year: 1971,
      genres: ['Rock'],
      styles: ['Heavy Psych'],
      labels: [{ name: 'Radar', catno: 'C1', id: 1, resource_url: '' }],
      formats: [{ name: 'LP', qty: '1' }],
      artists: [artist({ name: 'Rush' })],
    },
  }),
  release({
    id: 2,
    instance_id: 2,
    date_added: '2022-11-02T10:00:00Z',
    basic_information: {
      ...basic,
      master_id: 0,
      year: 1985,
      genres: ['Jazz'],
      styles: ['Fusion'],
      labels: [{ name: 'Blue Note', catno: 'C2', id: 2, resource_url: '' }],
      formats: [{ name: 'CD', qty: '1' }],
      artists: [artist({ name: 'Herbie Hancock' })],
    },
  }),
]

describe('StatsPanel', () => {
  it('shows the totals and every breakdown section', () => {
    render(<StatsPanel releases={collection} masterYears={{}} value={idleValue()} />)

    expect(screen.getByRole('heading', { name: 'Collection stats' })).toBeInTheDocument()

    const tiles = screen.getAllByText(/^(releases|unique albums|artists)$/)
    expect(tiles.map((t) => t.textContent)).toEqual([
      'releases',
      'unique albums',
      'artists',
    ])
    // 2 releases, 2 unique albums, 2 artists in this fixture.
    for (const label of tiles) {
      expect(label.previousElementSibling).toHaveTextContent('2')
    }

    for (const heading of [
      'Release years',
      'Acquired over time',
      'Top genres',
      'Top styles',
      'Top labels',
      'Top formats',
    ]) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    }

    expect(screen.getByText('Rock')).toBeInTheDocument()
    expect(screen.getByText('Blue Note')).toBeInTheDocument()
  })

  it('charts the year distribution and the acquisition timeline', () => {
    render(<StatsPanel releases={collection} masterYears={{}} value={idleValue()} />)
    expect(screen.getByRole('img', { name: 'Releases by year' })).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Releases added to collection over time' }),
    ).toBeInTheDocument()
  })

  it('labels each chart and gives every bar a hover tooltip', () => {
    const { container } = render(
      <StatsPanel releases={collection} masterYears={{}} value={idleValue()} />,
    )
    const tooltips = [...container.querySelectorAll('.stats-chart-svg rect title')]
    expect(tooltips.length).toBeGreaterThan(0)
    expect(tooltips.some((t) => t.textContent === '1971 · 1 release')).toBe(true)
    expect(screen.getByText('1971')).toBeInTheDocument()
    expect(screen.getByText('1985')).toBeInTheDocument()
  })

  it('closes through the shared card close button', async () => {
    const onClose = vi.fn()
    render(
      <StatsPanel
        releases={collection}
        masterYears={{}}
        value={idleValue()}
        onClose={onClose}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Close stats' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('explains an empty collection instead of rendering empty charts', () => {
    render(<StatsPanel releases={[]} masterYears={{}} value={idleValue()} />)
    expect(screen.getByText('No releases to summarise yet.')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('StatsPanel collection value', () => {
  it('renders the low, median and high valuation', () => {
    render(
      <StatsPanel
        releases={collection}
        masterYears={{}}
        value={idleValue({
          value: { minimum: '€121', median: '€640', maximum: '€4,200' },
          fetchedAt: new Date('2024-05-01T10:00:00Z').getTime(),
        })}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Estimated value' })).toBeInTheDocument()
    expect(screen.getByText('€121')).toBeInTheDocument()
    expect(screen.getByText('€640')).toBeInTheDocument()
    expect(screen.getByText('€4,200')).toBeInTheDocument()
    for (const label of ['low', 'median', 'high']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('puts the updated stamp on its own line below the note', () => {
    render(
      <StatsPanel
        releases={collection}
        masterYears={{}}
        value={idleValue({
          value: { minimum: '$1', median: '$2', maximum: '$3' },
          fetchedAt: new Date('2024-05-01T10:00:00Z').getTime(),
        })}
      />,
    )

    const note = screen.getByText(/Discogs' own estimate.*marketplace sales\./)
    expect(note).not.toHaveTextContent(/Updated/)
    const updated = screen.getByText(/^Updated .*\.$/)
    expect(updated.className).toContain('stats-updated')
    expect(note.compareDocumentPosition(updated) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows a dash for figures Discogs did not send', () => {
    render(
      <StatsPanel
        releases={collection}
        masterYears={{}}
        value={idleValue({ value: { minimum: '$100', median: '', maximum: '' } })}
      />,
    )

    expect(screen.getByText('$100')).toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(2)
  })

  it('says the estimate is for the whole collection', () => {
    render(
      <StatsPanel
        releases={collection}
        masterYears={{}}
        value={idleValue({
          value: { minimum: '$1', median: '$2', maximum: '$3' },
        })}
      />,
    )
    expect(screen.getByText(/whole collection/)).toBeInTheDocument()
  })

  it('reports a failure while keeping any cached valuation on screen', () => {
    render(
      <StatsPanel
        releases={collection}
        masterYears={{}}
        value={idleValue({
          value: { minimum: '$10', median: '$20', maximum: '$30' },
          error: 'Discogs request failed (403).',
          status: 'error',
        })}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Discogs request failed (403).')
    expect(screen.getByText('$20')).toBeInTheDocument()
  })

  it('refreshes the valuation on demand', async () => {
    const refresh = vi.fn()
    render(
      <StatsPanel
        releases={collection}
        masterYears={{}}
        
        value={idleValue({
          value: { minimum: '$1', median: '$2', maximum: '$3' },
          refresh,
        })}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(refresh).toHaveBeenCalled()
  })
})
