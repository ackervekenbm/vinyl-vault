import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearMasterYears,
  clearReleaseDetails,
  countReleaseDetails,
  getCachedCollection,
  getMasterYears,
  getReleaseTracklist,
  removeCachedCollection,
  setCachedCollection,
  setMasterYears,
  setReleaseTracklist,
} from './collection'
import { release } from '../test/factories'

beforeEach(async () => {
  // Reset all stores so tests are independent.
  await clearMasterYears()
  await clearReleaseDetails()
  await removeCachedCollection('alice')
  await removeCachedCollection('bob')
})

describe('collection store (fake IndexedDB)', () => {
  it('stores and retrieves one row per username', async () => {
    const entry = {
      username: 'alice',
      fetchedAt: 42,
      items: 1,
      releases: [release()],
      folders: [{ id: 1, name: 'All', count: 1 }],
    }
    await setCachedCollection('alice', entry)
    await setCachedCollection('bob', { ...entry, username: 'bob' })

    expect(await getCachedCollection('alice')).toEqual(entry)
    expect(await getCachedCollection('bob')).toMatchObject({ username: 'bob' })
    expect(await getCachedCollection('nobody')).toBeUndefined()
  })

  it('removes the cached collection', async () => {
    await setCachedCollection('alice', {
      username: 'alice',
      fetchedAt: 1,
      items: 0,
      releases: [],
      folders: [],
    })
    await removeCachedCollection('alice')
    expect(await getCachedCollection('alice')).toBeUndefined()
  })
})

describe('masterYears store', () => {
  it('round-trips and resets to an empty object when absent', async () => {
    expect(await getMasterYears()).toEqual({})
    await setMasterYears({ 1: 1984, 2: null })
    expect(await getMasterYears()).toEqual({ 1: 1984, 2: null })
    await clearMasterYears()
    expect(await getMasterYears()).toEqual({})
  })
})

describe('releaseDetails store', () => {
  it('stores, counts and clears tracklists by release id', async () => {
    expect(await getReleaseTracklist(1)).toBeUndefined()
    await setReleaseTracklist(1, [{ position: 'A1', title: 'One', duration: '3:00' }])
    await setReleaseTracklist(2, [{ position: 'B1', title: 'Two', duration: '4:00' }])
    expect(await getReleaseTracklist(1)).toEqual([
      { position: 'A1', title: 'One', duration: '3:00' },
    ])
    expect(await countReleaseDetails()).toBe(2)
    await clearReleaseDetails()
    expect(await countReleaseDetails()).toBe(0)
  })
})