import { openDB } from 'idb'
import type { DiscogsCollectionFolder, DiscogsCollectionRelease, DiscogsTrack } from '../types/discogs'
import type { MasterYears } from '../api/discogs'

export interface CachedCollection {
  username: string
  fetchedAt: number
  releases: DiscogsCollectionRelease[]
  items: number
  folders: DiscogsCollectionFolder[]
}

const DB_NAME = 'vinyl-vault'
const STORE = 'collection'
const MASTER_STORE = 'masterYears'
const DETAIL_STORE = 'releaseDetails'
const VERSION = 3
const MASTER_KEY = 'all'

const dbPromise = openDB(DB_NAME, VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE)) {
      db.createObjectStore(STORE)
    }
    if (!db.objectStoreNames.contains(MASTER_STORE)) {
      db.createObjectStore(MASTER_STORE)
    }
    if (!db.objectStoreNames.contains(DETAIL_STORE)) {
      db.createObjectStore(DETAIL_STORE)
    }
  },
})

export async function getCachedCollection(username: string): Promise<CachedCollection | undefined> {
  const db = await dbPromise
  const entry = await db.get(STORE, username)
  return entry as CachedCollection | undefined
}

export async function setCachedCollection(username: string, entry: CachedCollection): Promise<void> {
  const db = await dbPromise
  await db.put(STORE, entry, username)
}

export async function removeCachedCollection(username: string): Promise<void> {
  const db = await dbPromise
  await db.delete(STORE, username)
}

export async function getMasterYears(): Promise<MasterYears> {
  const db = await dbPromise
  const entry = await db.get(MASTER_STORE, MASTER_KEY)
  return (entry as MasterYears | undefined) ?? {}
}

export async function setMasterYears(years: MasterYears): Promise<void> {
  const db = await dbPromise
  await db.put(MASTER_STORE, years, MASTER_KEY)
}

export async function clearMasterYears(): Promise<void> {
  const db = await dbPromise
  await db.delete(MASTER_STORE, MASTER_KEY)
}

export async function getReleaseTracklist(releaseId: number): Promise<DiscogsTrack[] | undefined> {
  const db = await dbPromise
  return (await db.get(DETAIL_STORE, releaseId)) as DiscogsTrack[] | undefined
}

export async function setReleaseTracklist(releaseId: number, tracks: DiscogsTrack[]): Promise<void> {
  const db = await dbPromise
  await db.put(DETAIL_STORE, tracks, releaseId)
}

export async function clearReleaseDetails(): Promise<void> {
  const db = await dbPromise
  await db.clear(DETAIL_STORE)
}

export async function countReleaseDetails(): Promise<number> {
  const db = await dbPromise
  return await db.count(DETAIL_STORE)
}