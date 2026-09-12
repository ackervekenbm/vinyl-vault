import type {
  DiscogsCollectionFolder,
  DiscogsCollectionFolderResponse,
  DiscogsCollectionRelease,
  DiscogsFoldersResponse,
  DiscogsMaster,
  DiscogsRelease,
  DiscogsTrack,
} from '../types/discogs'

const API_BASE = 'https://api.discogs.com'
const USER_AGENT = 'VinylVault/0.1 (+local personal collection viewer)'

export class DiscogsError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'DiscogsError'
    this.status = status
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function discogsFetch(path: string, token: string, signal?: AbortSignal): Promise<Response> {
  const response = await fetch(`${API_BASE}${path}`, {
    signal,
    headers: {
      Authorization: `Discogs token=${token}`,
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  })
  return response
}

export interface ProgressInfo {
  loaded: number
  total: number
}

export interface CollectionResult {
  releases: DiscogsCollectionRelease[]
  items: number
}

export async function fetchCollection(
  username: string,
  token: string,
  onProgress?: (progress: ProgressInfo) => void,
  signal?: AbortSignal,
): Promise<CollectionResult> {
  const perPage = 100
  const first = await requestPage(
    `/users/${encodeURIComponent(username)}/collection/folders/0/releases?page=1&per_page=${perPage}`,
    token,
    signal,
  )

  const pages = first.pagination.pages
  const releases = [...first.releases]
  onProgress?.({ loaded: releases.length, total: first.pagination.items })

  for (let page = 2; page <= pages; page++) {
    await sleep(1100)
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const data = await requestPage(
      `/users/${encodeURIComponent(username)}/collection/folders/0/releases?page=${page}&per_page=${perPage}`,
      token,
      signal,
    )
    releases.push(...data.releases)
    onProgress?.({ loaded: releases.length, total: first.pagination.items })
  }

  return { releases, items: first.pagination.items }
}

export async function fetchFolders(
  username: string,
  token: string,
  signal?: AbortSignal,
): Promise<DiscogsCollectionFolder[]> {
  const data = await requestJson<DiscogsFoldersResponse>(
    `/users/${encodeURIComponent(username)}/collection/folders`,
    token,
    signal,
  )
  return data.folders ?? []
}

export async function fetchReleaseTracklist(
  releaseId: number,
  token: string,
  signal?: AbortSignal,
): Promise<DiscogsTrack[]> {
  const data = await requestJson<DiscogsRelease>(`/releases/${releaseId}`, token, signal)
  return data.tracklist ?? []
}

async function requestJson<T>(
  path: string,
  token: string,
  signal?: AbortSignal,
): Promise<T> {
  const maxRetries = 5
  let attempt = 0

  for (;;) {
    let response: Response
    try {
      response = await discogsFetch(path, token, signal)
    } catch (err) {
      if (signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
        throw new DOMException('Aborted', 'AbortError')
      }
      if (attempt >= maxRetries) throw new DiscogsError('Network error talking to Discogs.', 0)
      attempt++
      const wait = 1000 * 2 ** attempt + Math.random() * 400
      await sleep(wait)
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      continue
    }

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get('Retry-After') ?? '') || 0
      if (attempt >= maxRetries) {
        throw new DiscogsError('Discogs rate limit hit. Try again in a minute.', 429)
      }
      attempt++
      await sleep(Math.min(retryAfter * 1000, 30000) || 3000)
      continue
    }

    if (!response.ok) {
      throw new DiscogsError(await describeError(response), response.status)
    }

    return (await response.json()) as T
  }
}

function requestPage(
  path: string,
  token: string,
  signal?: AbortSignal,
): Promise<DiscogsCollectionFolderResponse> {
  return requestJson<DiscogsCollectionFolderResponse>(path, token, signal)
}

async function describeError(response: Response): Promise<string> {
  let message = `Discogs request failed (${response.status}).`
  try {
    const body = (await response.json()) as { message?: string; error?: string }
    message = body.message ?? body.error ?? message
  } catch {
    // fall through, keep generic message
  }
  if (response.status === 401) message = `${message} Check your personal access token.`
  if (response.status === 404) message = `${message} Is the username right?`
  return message
}

// Year a master's music was originally released. Fetched per unique master,
// paced to stay inside Discogs' rate limit. `null` = no usable year (kept in
// the cache so we don't re-request known-missing masters on every sync).
export type MasterYears = Record<number, number | null>

export async function fetchMasterYears(
  masterIds: number[],
  token: string,
  onProgress?: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<MasterYears> {
  const ids = [...new Set(masterIds)]
  const result: MasterYears = {}
  let done = 0

  for (const id of ids) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

    const maxAttempts = 3
    let attempts = 0
    for (;;) {
      let response: Response
      try {
        response = await discogsFetch(`/masters/${id}`, token, signal)
      } catch (err) {
        if (signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
          throw new DOMException('Aborted', 'AbortError')
        }
        if (++attempts >= maxAttempts) {
          result[id] = null
          break
        }
        await sleep(1200 * attempts)
        continue
      }

      if (response.status === 429) {
        const retryAfter = Number(response.headers.get('Retry-After') ?? '') || 3000
        await sleep(Math.min(retryAfter, 30000))
        continue
      }

      if (response.ok) {
        const master = (await response.json()) as DiscogsMaster
        result[id] = typeof master.year === 'number' ? master.year : null
        break
      }

      if (response.status === 404) {
        result[id] = null
        break
      }

      if (++attempts >= maxAttempts) {
        result[id] = null
        break
      }
      await sleep(1200 * attempts)
    }

    done++
    onProgress?.(done, ids.length)

    // Stay within ~60 req/min while many masters are pending.
    if (ids.length > 1) await sleep(1100)
  }

  return result
}