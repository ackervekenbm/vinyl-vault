import type { DiscogsArtistRef, DiscogsCollectionRelease } from '../types/discogs'
import type { MasterYears } from '../api/discogs'
import { compareSortKeys, makeSortKey, sortLetter } from './sortName'

export interface DisplayRelease {
  key: string
  instanceId: number
  id: number
  title: string
  titleKey: string
  year: number
  originalYear: number
  artistName: string
  genres: string[]
  styles: string[]
  labels: string[]
  formatNames: string[]
  formatText: string
  coverImage: string
  thumb: string
  release: DiscogsCollectionRelease
}

export interface GroupedArtist {
  id: string
  name: string
  sortKey: string
  letter: string
  releases: DisplayRelease[]
}

export interface Filters {
  format: string
  genre: string
  style: string
  label: string
  yearMin: number | null
  yearMax: number | null
}

export const DEFAULT_FILTERS: Filters = {
  format: '',
  genre: '',
  style: '',
  label: '',
  yearMin: null,
  yearMax: null,
}

export function activeFilterCount(filters: Filters): number {
  let count = 0
  if (filters.format) count++
  if (filters.genre) count++
  if (filters.style) count++
  if (filters.label) count++
  if (filters.yearMin != null) count++
  if (filters.yearMax != null) count++
  return count
}

export interface FilterOptions extends Filters {
  query: string
}

const UNKNOWN_ARTIST = 'Unknown artist'

export function artistDisplayName(artist: DiscogsArtistRef): string {
  const raw = (artist.name || artist.anv || '').trim()
  const cleaned = raw.replace(/\s*\(\d+\)\s*$/, '')
  return cleaned || UNKNOWN_ARTIST
}

export function creditedArtists(artists: DiscogsArtistRef[]): string {
  let result = ''
  artists.forEach((artist, index) => {
    if (index > 0) {
      const join = artists[index - 1].join?.trim()
      result += join && join.length > 0 ? ` ${join} ` : ', '
    }
    result += artistDisplayName(artist)
  })
  return result || UNKNOWN_ARTIST
}

function primaryArtistName(release: DiscogsCollectionRelease): string {
  const artist = release.basic_information.artists?.[0]
  if (!artist) return UNKNOWN_ARTIST
  return artistDisplayName(artist)
}

// A release can be credited to several artists (splits, collaborations). We
// cross-list those under every credited artist, but keep multi-artist
// compilations under a single "Various" group so they don't flood the list.
function artistGroupNames(release: DiscogsCollectionRelease): string[] {
  const artists = release.basic_information?.artists ?? []
  if (artists.length === 0) return [UNKNOWN_ARTIST]

  const primary = artistDisplayName(artists[0])
  if (primary.toLowerCase() === 'various') return [primary]

  const names: string[] = []
  for (const artist of artists) {
    const name = artistDisplayName(artist)
    if (!names.includes(name)) names.push(name)
  }
  return names.length > 0 ? names : [UNKNOWN_ARTIST]
}

function formatTextOf(release: DiscogsCollectionRelease): string {
  return (release.basic_information.formats ?? [])
    .map((format) => {
      const descriptors = (format.descriptions ?? [])
        .map((part) => part.trim())
        .filter(Boolean)
      return [format.name, ...descriptors].join(' · ')
    })
    .join(' / ')
}

function formatNamesOf(release: DiscogsCollectionRelease): string[] {
  const names = (release.basic_information.formats ?? []).map((format) => format.name)
  return [...new Set(names)]
}

function coverImageOf(release: DiscogsCollectionRelease): string {
  const basic = release.basic_information
  return basic?.cover_image || basic?.thumb || ''
}

function originalYearOf(release: DiscogsCollectionRelease, masterYears: MasterYears): number {
  const masterId = release.basic_information?.master_id
  const masterYear = typeof masterId === 'number' ? masterYears[masterId] : undefined
  if (typeof masterYear === 'number' && masterYear > 0) return masterYear
  return release.basic_information?.year ?? 0
}

export function toDisplayRelease(
  release: DiscogsCollectionRelease,
  masterYears: MasterYears = {},
): DisplayRelease {
  const basic = release.basic_information ?? ({} as DiscogsCollectionRelease['basic_information'])
  const title = basic.title || 'Untitled'
  return {
    key: `${release.id ?? '?'}-${release.instance_id ?? '?'}`,
    instanceId: release.instance_id,
    id: release.id,
    title,
    titleKey: makeSortKey(title),
    year: basic.year,
    originalYear: originalYearOf(release, masterYears),
    artistName: primaryArtistName(release),
    genres: basic.genres ?? [],
    styles: basic.styles ?? [],
    labels: (basic.labels ?? []).map((label) => label.name),
    formatNames: formatNamesOf(release),
    formatText: formatTextOf(release),
    coverImage: coverImageOf(release),
    thumb: basic.thumb ?? '',
    release,
  }
}

export function filterReleases(
  releases: DiscogsCollectionRelease[],
  options: FilterOptions,
  masterYears: MasterYears = {},
): DiscogsCollectionRelease[] {
  const query = (options.query ?? '').trim().toLowerCase()
  const format = (options.format ?? '').trim().toLowerCase()
  const genre = (options.genre ?? '').trim().toLowerCase()
  const style = (options.style ?? '').trim().toLowerCase()
  const label = (options.label ?? '').trim().toLowerCase()
  const yearMin = options.yearMin ?? 0
  const yearMax = options.yearMax ?? 0

  const hasFilters =
    query || format || genre || style || label || yearMin || yearMax
  if (!hasFilters) return releases

  return releases.filter((release) => {
    const basic = release.basic_information
    if (genre && !(basic.genres ?? []).some((g) => g.toLowerCase() === genre)) return false
    if (style && !(basic.styles ?? []).some((s) => s.toLowerCase() === style)) return false
    if (label && !(basic.labels ?? []).some((l) => l.name?.toLowerCase() === label)) return false
    if (format) {
      const matches = (basic.formats ?? []).some(
        (f) =>
          f.name.toLowerCase() === format ||
          (f.descriptions ?? []).some((d) => d.toLowerCase() === format),
      )
      if (!matches) return false
    }
    const originalYear = originalYearOf(release, masterYears)
    if (yearMin && originalYear < yearMin) return false
    if (yearMax && originalYear > yearMax) return false
    if (query) {
      const haystack = [
        basic.title,
        ...(basic.artists ?? []).map((a) => a.name),
        ...(basic.genres ?? []),
        ...(basic.styles ?? []),
        ...(basic.labels ?? []).map((l) => l.name),
        String(basic.year ?? ''),
        String(originalYearOf(release, masterYears) || ''),
      ]
        .join('  ')
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })
}

export function groupReleases(
  releases: DiscogsCollectionRelease[],
  masterYears: MasterYears = {},
): GroupedArtist[] {
  const byArtist = new Map<string, GroupedArtist>()

  for (const release of releases) {
    const display = toDisplayRelease(release, masterYears)
    for (const name of artistGroupNames(release)) {
      let artist = byArtist.get(name)
      if (!artist) {
        const sortKey = makeSortKey(name)
        artist = {
          id: name,
          name,
          sortKey,
          letter: sortLetter(sortKey),
          releases: [],
        }
        byArtist.set(name, artist)
      }
      artist.releases.push(display)
    }
  }

  const artists = [...byArtist.values()].sort((a, b) =>
    compareSortKeys(a.sortKey, b.sortKey),
  )
  return artists
}

export function distinctFormats(releases: DiscogsCollectionRelease[]): string[] {
  const names = new Set<string>()
  for (const release of releases) {
    for (const format of release.basic_information.formats ?? []) {
      names.add(format.name)
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

export function distinctGenres(releases: DiscogsCollectionRelease[]): string[] {
  const names = new Set<string>()
  for (const release of releases) {
    for (const genre of release.basic_information.genres ?? []) {
      names.add(genre)
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

export function distinctStyles(releases: DiscogsCollectionRelease[]): string[] {
  const names = new Set<string>()
  for (const release of releases) {
    for (const style of release.basic_information.styles ?? []) {
      names.add(style)
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

export function distinctLabels(releases: DiscogsCollectionRelease[]): string[] {
  const names = new Set<string>()
  for (const release of releases) {
    for (const label of release.basic_information.labels ?? []) {
      if (label.name) names.add(label.name)
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

export function yearBounds(
  releases: DiscogsCollectionRelease[],
  masterYears: MasterYears = {},
): { min: number; max: number } | null {
  let min = Infinity
  let max = -Infinity
  for (const release of releases) {
    const year = originalYearOf(release, masterYears)
    if (year > 0) {
      if (year < min) min = year
      if (year > max) max = year
    }
  }
  return Number.isFinite(min) ? { min, max } : null
}

export function countUniqueAlbums(releases: DiscogsCollectionRelease[]): number {
  const masters = new Set<number>()
  const ids = new Set<number>()
  for (const release of releases) {
    const masterId = release.basic_information?.master_id
    // 0 is Discogs' "no master linked" marker: not a real master, and lumping
    // every masterless release together as one fake album is wrong.
    if (typeof masterId === 'number' && masterId > 0) masters.add(masterId)
    else ids.add(release.id)
  }
  return masters.size + ids.size
}

export interface YearLine {
  label?: string
  value: number
}

export function effectiveYears(display: DisplayRelease): YearLine[] {
  const original = display.originalYear
  const pressing = display.year

  if (original && pressing) {
    if (original === pressing) return [{ value: original }]
    return [
      { label: 'Original', value: original },
      { label: 'Pressing', value: pressing },
    ]
  }
  const lines: YearLine[] = []
  if (original) lines.push({ value: original })
  if (pressing) lines.push({ value: pressing })
  return lines
}

export type ArtistSortMode = 'chronological' | 'byName'