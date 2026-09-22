import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  formatBytes,
  gatherStorageStats,
  getStorageEstimate,
  scanIndexedDb,
  scanLocalStorage,
} from './storage'
import { release } from '../test/factories'

describe('formatBytes', () => {
  it('renders plain bytes and orders of magnitude', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(10 * 1024)).toBe('10 KB')
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
  })

  it('degrades gracefully for invalid input', () => {
    expect(formatBytes(-1)).toBe('—')
    expect(formatBytes(NaN)).toBe('—')
    expect(formatBytes(Infinity)).toBe('—')
  })
})

describe('getStorageEstimate (secure-context only)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns an estimate from navigator.storage', async () => {
    vi.stubGlobal('navigator', { storage: { estimate: async () => ({ quota: 1000, usage: 42 }) } })
    await expect(getStorageEstimate()).resolves.toEqual({ quota: 1000, usage: 42 })
  })

  it('returns null when unsupported or when the values are missing', async () => {
    vi.stubGlobal('navigator', {})
    await expect(getStorageEstimate()).resolves.toBeNull()
    vi.stubGlobal('navigator', { storage: { estimate: async () => ({ quota: 'x', usage: 0 }) } })
    await expect(getStorageEstimate()).resolves.toBeNull()
  })
})

describe('scanLocalStorage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('reports keys and a byte total', () => {
    localStorage.setItem('vinyl-vault:settings', JSON.stringify({ username: 'x' }))
    const stat = scanLocalStorage()
    expect(stat.keys).toBe(1)
    expect(stat.bytes).toBeGreaterThan(0)
  })
})

describe('scanIndexedDb', () => {
  it('computes the collection, master and tracklist stats (using fake idb)', async () => {
    await import('../db/collection')
      .then(async (db) => {
        await db.setCachedCollection('alice', {
          username: 'alice',
          fetchedAt: 1234,
          items: 1,
          releases: [
            release({ id: 1, instance_id: 11 }),
            release({ id: 2, instance_id: 22 }),
          ],
          folders: [{ id: 1, name: 'All', count: 2 }],
        })
        await db.setMasterYears({ 900: 1975, 901: null })
        await db.setReleaseTracklist(1, [{ position: 'A1', title: 'Track', duration: '3:00' }])
      })

    const stat = await scanIndexedDb('alice')
    expect(stat.collection?.username).toBe('alice')
    expect(stat.collection?.releaseCount).toBe(2)
    expect(stat.collection?.folderCount).toBe(1)
    expect(stat.collection?.items).toBe(1)
    expect(stat.collection?.uniqueMasters).toBe(1)
    expect(stat.collection?.bytes).toBeGreaterThan(0)
    expect(stat.masterYears).toEqual({ cachedIds: 2, withYear: 1, bytes: expect.any(Number) })
    expect(stat.detailCount).toBe(1)
  })
})

describe('gatherStorageStats', () => {
  it('aggregates every source without throwing', async () => {
    const db = await import('../db/collection')
    await db.clearMasterYears()
    await db.clearReleaseDetails()

    const stats = await gatherStorageStats('nobody')
    expect(stats.indexedDb.collection).toBeNull()
    expect(stats.indexedDb.masterYears.cachedIds).toBe(0)
    expect(stats.localStorage.keys).toBe(0)
    expect(stats.origin).toBeNull() // jsdom has no navigator.storage
    expect(stats.persisted).toBeNull()
    expect(stats.caches).toBeNull()
  })
})