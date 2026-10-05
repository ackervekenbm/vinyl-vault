// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 ackervekenbm

import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchCollectionValue } from '../api/discogs'
import { getCachedCollectionValue, setCachedCollectionValue } from '../db/collection'
import type { CollectionValue } from '../types/discogs'

export interface CollectionValueState {
  value: CollectionValue | null
  fetchedAt: number | null
  status: 'idle' | 'loading' | 'error'
  error: string | null
  /** Start loading the valuation (and show any cached copy). */
  open: () => void
  /** Re-fetch, ignoring the cached copy. */
  refresh: () => void
}

interface Account {
  username: string
  token: string
}

type Status = CollectionValueState['status']

interface Loaded {
  key: string
  value: CollectionValue | null
  fetchedAt: number | null
  error: string | null
}

const EMPTY: Loaded = { key: '', value: null, fetchedAt: null, error: null }

/**
 * Discogs' valuation of the whole collection.
 *
 * Deliberately lazy: nothing is requested until the user opens the stats
 * panel, and a cached copy is shown as soon as it is read. A valuation moves
 * slowly, so the cache is kept until the user asks for a refresh instead of
 * being re-fetched on every load.
 *
 * Everything is keyed on the account so a value fetched for one user can never
 * be shown for another while the new account loads.
 */
export function useCollectionValue(account: Account | null): CollectionValueState {
  const accountKey = account ? `${account.username}\u0001${account.token}` : ''
  const [loaded, setLoaded] = useState<Loaded>(EMPTY)
  // The account whose valuation has been asked for. Keyed rather than a plain
  // boolean so a request in flight for one account never marks another account
  // as loading, and so switching accounts starts from "not asked yet".
  const [requestedKey, setRequestedKey] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  // Switching accounts resets the request state. Adjusting state during render
  // (rather than in an effect) avoids a wasted render pass.
  const [lastKey, setLastKey] = useState(accountKey)
  if (lastKey !== accountKey) {
    setLastKey(accountKey)
    setRequestedKey(null)
  }

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!accountKey) return

    const controller = new AbortController()
    abortRef.current?.abort()
    abortRef.current = controller
    let cancelled = false

    const username = accountKey.slice(0, accountKey.indexOf('\u0001'))
    const token = accountKey.slice(accountKey.indexOf('\u0001') + 1)

    // Show the cached copy straight away; a failure to read the cache is not
    // worth surfacing because the fetch below still runs.
    void getCachedCollectionValue(username)
      .then((cached) => {
        if (cancelled || !cached) return
        setLoaded((prev) =>
          prev.key === accountKey && prev.value
            ? prev
            : {
                key: accountKey,
                value: cached.value,
                fetchedAt: cached.fetchedAt,
                error: null,
              },
        )
      })
      .catch(() => {})

    if (requestedKey !== accountKey) return

    void (async () => {
      try {
        const value = await fetchCollectionValue(username, token, controller.signal)
        if (cancelled || controller.signal.aborted) return
        const fetchedAt = Date.now()
        setLoaded({ key: accountKey, value, fetchedAt, error: null })
        await setCachedCollectionValue(username, { value, fetchedAt })
      } catch (err) {
        if (cancelled || controller.signal.aborted) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        // Keep this account's own cached value on screen and report the failure
        // alongside it, so a temporary error never blanks a valuation we had.
        // A value belonging to a *previous* account is deliberately dropped.
        setLoaded((prev) => ({
          key: accountKey,
          value: prev.key === accountKey ? prev.value : null,
          fetchedAt: prev.key === accountKey ? prev.fetchedAt : null,
          error: err instanceof Error ? err.message : 'Could not load the collection value.',
        }))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [accountKey, requestedKey, nonce])

  const open = useCallback(() => setRequestedKey(accountKey || null), [accountKey])

  const refresh = useCallback(() => {
    setRequestedKey(accountKey || null)
    setNonce((n) => n + 1)
  }, [accountKey])

  // Everything is scoped to the current account: data loaded for a previous one
  // is never surfaced. `status` is derived rather than stored, so the effect
  // never has to setState synchronously just to say "loading".
  const mine = accountKey !== '' && loaded.key === accountKey
  const value = mine ? loaded.value : null
  const status: Status =
    mine && loaded.error
      ? 'error'
      : requestedKey === accountKey && !value
        ? 'loading'
        : 'idle'

  return {
    value,
    fetchedAt: mine ? loaded.fetchedAt : null,
    status,
    error: mine ? loaded.error : null,
    open,
    refresh,
  }
}
