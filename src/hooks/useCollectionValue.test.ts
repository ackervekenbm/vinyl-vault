// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 ackervekenbm

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useCollectionValue } from './useCollectionValue'
import * as db from '../db/collection'
import * as api from '../api/discogs'

const alice = { username: 'alice', token: 'tok-a' }
const bob = { username: 'bob', token: 'tok-b' }

const value = (median: number) => ({ minimum: '$1', median: `$${median}`, maximum: '$3' })

/** A fetch that stays pending until the test releases it. */
function deferred() {
  let resolve!: (v: ReturnType<typeof value>) => void
  const promise = new Promise<ReturnType<typeof value>>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useCollectionValue', () => {
  it('does not fetch anything until it is opened', async () => {
    const spy = vi.spyOn(api, 'fetchCollectionValue').mockResolvedValue(value(2))
    vi.spyOn(db, 'getCachedCollectionValue').mockResolvedValue(undefined)

    renderHook(() => useCollectionValue(alice))
    await Promise.resolve()

    expect(spy).not.toHaveBeenCalled()
  })

  it('fetches once opened and exposes the valuation', async () => {
    const spy = vi.spyOn(api, 'fetchCollectionValue').mockResolvedValue(value(2))
    vi.spyOn(db, 'getCachedCollectionValue').mockResolvedValue(undefined)
    vi.spyOn(db, 'setCachedCollectionValue').mockResolvedValue(undefined)

    const { result } = renderHook(() => useCollectionValue(alice))

    act(() => result.current.open())

    await waitFor(() => expect(result.current.value).toEqual(value(2)))
    expect(spy).toHaveBeenCalledWith('alice', 'tok-a', expect.anything())
    expect(result.current.status).toBe('idle')
  })

  it('shows a cached valuation without waiting for the network', async () => {
    vi.spyOn(db, 'getCachedCollectionValue').mockResolvedValue({
      value: value(9),
      fetchedAt: 1234,
    })
    const net = deferred()
    const spy = vi.spyOn(api, 'fetchCollectionValue').mockReturnValue(net.promise)

    const { result } = renderHook(() => useCollectionValue(alice))
    act(() => result.current.open())

    // The cached copy is on screen while the network request is still in
    // flight — the point of caching the valuation.
    await waitFor(() => expect(result.current.value?.median).toBe('$9'))
    expect(result.current.fetchedAt).toBe(1234)
    expect(spy).toHaveBeenCalled()

    // The fresh value replaces it once it arrives.
    await act(async () => {
      net.resolve(value(2))
      await net.promise
    })
    await waitFor(() => expect(result.current.value?.median).toBe('$2'))
  })

  it('never shows one account\'s valuation for another', async () => {
    vi.spyOn(db, 'getCachedCollectionValue').mockImplementation(async (username) =>
      username === 'alice' ? { value: value(1), fetchedAt: 1 } : undefined,
    )
    const nets = [deferred(), deferred()]
    let call = 0
    vi.spyOn(api, 'fetchCollectionValue').mockImplementation(() => nets[call++].promise)
    vi.spyOn(db, 'setCachedCollectionValue').mockResolvedValue(undefined)

    const { result, rerender } = renderHook(({ account }) => useCollectionValue(account), {
      initialProps: { account: alice },
    })
    act(() => result.current.open())
    await waitFor(() => expect(result.current.value?.median).toBe('$1'))

    rerender({ account: bob })
    act(() => result.current.open())

    // Bob's valuation is still in flight: alice's must not be standing in.
    expect(result.current.value).toBeNull()
    expect(result.current.status).toBe('loading')

    await act(async () => {
      nets[1].resolve(value(2))
      await nets[1].promise
    })
    await waitFor(() => expect(result.current.value?.median).toBe('$2'))
    expect(api.fetchCollectionValue).toHaveBeenLastCalledWith('bob', 'tok-b', expect.anything())
  })

  it('keeps the cached valuation visible when a refresh fails', async () => {
    vi.spyOn(db, 'getCachedCollectionValue').mockResolvedValue({
      value: value(7),
      fetchedAt: 1,
    })
    vi.spyOn(api, 'fetchCollectionValue').mockRejectedValue(new Error('Discogs is down'))
    vi.spyOn(db, 'setCachedCollectionValue').mockResolvedValue(undefined)

    const { result } = renderHook(() => useCollectionValue(alice))
    act(() => result.current.open())

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe('Discogs is down')
    expect(result.current.value?.median).toBe('$7')
  })

  it('reports no value and no error when there is no account', async () => {
    const { result } = renderHook(() => useCollectionValue(null))
    act(() => result.current.open())
    await Promise.resolve()

    expect(result.current.value).toBeNull()
    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBeNull()
  })
})
