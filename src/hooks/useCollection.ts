import { useState, useEffect, useCallback, useRef } from 'react'
import type { Settings } from '../db/settings'
import {
  getCachedCollection,
  setCachedCollection,
  removeCachedCollection,
  getMasterYears,
  setMasterYears,
  clearMasterYears,
  clearReleaseDetails,
} from '../db/collection'
import {
  fetchCollection,
  fetchFolders,
  fetchMasterYears,
  type CollectionResult,
  type MasterYears,
} from '../api/discogs'
import type { DiscogsCollectionFolder, DiscogsCollectionRelease } from '../types/discogs'

export type Status = 'idle' | 'loading' | 'error'
export type SyncPhase = 'collection' | 'years'

export interface SyncProgress {
  phase: SyncPhase
  loaded: number
  total: number
}

interface UseCollectionResult {
  releases: DiscogsCollectionRelease[]
  folders: DiscogsCollectionFolder[]
  masterYears: MasterYears
  status: Status
  error: string | null
  progress: SyncProgress | null
  fetchedAt: number | null
  refresh: () => void
  wipeCache: () => Promise<void>
}

export function useCollection(settings: Settings | null): UseCollectionResult {
  const [releases, setReleases] = useState<DiscogsCollectionRelease[]>([])
  const [folders, setFolders] = useState<DiscogsCollectionFolder[]>([])
  const [masterYears, setMasterYearsState] = useState<MasterYears>({})
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<SyncProgress | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const load = useCallback(async (settings: Settings) => {
    const controller = new AbortController()
    abortRef.current?.abort()
    abortRef.current = controller

    setError(null)
    setProgress(null)

    // Attempt to show cache immediately (stale-while-revalidate)
    try {
      const [cached, years] = await Promise.all([
        getCachedCollection(settings.username),
        getMasterYears(),
      ])
      if (controller.signal.aborted) return
      if (cached) {
        setReleases(cached.releases)
        setFolders(cached.folders ?? [])
        setStatus('idle')
        setFetchedAt(cached.fetchedAt)
      }
      setMasterYearsState(years)
    } catch {
      // ignore cache read errors
    }

    setStatus('loading')

    try {
      const folders = await fetchFolders(settings.username, settings.token, controller.signal)
      if (controller.signal.aborted) return
      setFolders(folders)

      const result: CollectionResult = await fetchCollection(
        settings.username,
        settings.token,
        (p) => {
          if (!controller.signal.aborted) setProgress({ phase: 'collection', ...p })
        },
        controller.signal,
      )

      if (controller.signal.aborted) return

      // Fill in original release years for any masters we haven't cached yet.
      const masterIds = [
        ...new Set(
          result.releases
            .map((r) => r.basic_information?.master_id)
            .filter((id): id is number => typeof id === 'number'),
        ),
      ]
      let knownYears = await getMasterYears().catch(() => ({} as MasterYears))
      const missing = masterIds.filter((id) => !(id in knownYears))
      if (missing.length > 0) {
        const fetched = await fetchMasterYears(
          missing,
          settings.token,
          (loaded, total) => {
            if (!controller.signal.aborted) setProgress({ phase: 'years', loaded, total })
          },
          controller.signal,
        )
        knownYears = { ...knownYears, ...fetched }
        await setMasterYears(knownYears)
      }

      if (controller.signal.aborted) return

      setReleases(result.releases)
      setMasterYearsState(knownYears)
      setProgress(null)
      setStatus('idle')
      setFetchedAt(Date.now())

      await setCachedCollection(settings.username, {
        username: settings.username,
        fetchedAt: Date.now(),
        releases: result.releases,
        items: result.items,
        folders,
      })
    } catch (err) {
      if (controller.signal.aborted) return
      if (err instanceof DOMException && err.name === 'AbortError') return

      const message = err instanceof Error ? err.message : 'Unknown error occurred.'
      setProgress(null)
      setError(message)
      setStatus('error')
    }
  }, [])

  const refresh = useCallback(() => {
    if (!settings) return
    load(settings)
  }, [settings, load])

  const wipeCache = useCallback(async () => {
    if (!settings) return
    await removeCachedCollection(settings.username)
    await clearMasterYears()
    await clearReleaseDetails()
    setReleases([])
    setFolders([])
    setMasterYearsState({})
    setStatus('idle')
  }, [settings])

  // Load on mount and when settings change
  useEffect(() => {
    if (!settings) {
      // Reset all state when the account is cleared.
      /* eslint-disable react-hooks/set-state-in-effect */
      setReleases([])
      setFolders([])
      setMasterYearsState({})
      setStatus('idle')
      setError(null)
      setProgress(null)
      /* eslint-enable react-hooks/set-state-in-effect */
      return
    }
    load(settings)
  }, [settings, load])

  return { releases, folders, masterYears, status, error, progress, fetchedAt, refresh, wipeCache }
}