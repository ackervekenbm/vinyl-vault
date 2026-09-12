import { useEffect, useRef, useState } from 'react'
import type { DiscogsTrack } from '../types/discogs'
import { fetchReleaseTracklist } from '../api/discogs'
import { getReleaseTracklist, setReleaseTracklist } from '../db/collection'

interface UseReleaseTracklistResult {
  tracks: DiscogsTrack[] | null
  loading: boolean
  error: string | null
}

export function useReleaseTracklist(
  releaseId: number,
  token: string,
): UseReleaseTracklistResult {
  const [tracks, setTracks] = useState<DiscogsTrack[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    abortRef.current?.abort()
    abortRef.current = controller

    // Intentionally reset the result when the release or token changes.
    /* eslint-disable react-hooks/set-state-in-effect */
    setTracks(null)
    setError(null)
    setLoading(true)
    /* eslint-enable react-hooks/set-state-in-effect */

    const load = async () => {
      try {
        const cached = await getReleaseTracklist(releaseId).catch(() => undefined)
        if (controller.signal.aborted) return

        if (cached) {
          setTracks(cached)
        } else if (token) {
          const fetched = await fetchReleaseTracklist(releaseId, token, controller.signal)
          if (controller.signal.aborted) return
          setTracks(fetched)
          setReleaseTracklist(releaseId, fetched).catch(() => {})
        }
      } catch (err) {
        if (controller.signal.aborted) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Could not load the tracklist.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()

    return () => {
      controller.abort()
    }
  }, [releaseId, token])

  return { tracks, loading, error }
}