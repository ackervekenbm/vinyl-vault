import { useState, useEffect, useMemo, useCallback } from 'react'
import type { Settings as SettingsType } from './db/settings'
import { loadSettings, saveSettings, clearSettings } from './db/settings'
import type { ThemeId } from './theme'
import { applyTheme } from './theme'
import { useCollection, type SyncProgress } from './hooks/useCollection'
import {
  filterReleases,
  groupReleases,
  distinctFormats,
  distinctGenres,
  distinctStyles,
  distinctLabels,
  yearBounds,
  countUniqueAlbums,
  toDisplayRelease,
  DEFAULT_FILTERS,
  type DisplayRelease,
  type Filters,
  type ArtistSortMode,
} from './utils/collection'
import { SettingsForm } from './components/Settings'
import { StorageStats } from './components/StorageStats'
import { useScrollLock } from './hooks/useScrollLock'
import { SearchBar } from './components/SearchBar'
import { FiltersButton, FilterPanel } from './components/FilterMenu'
import { ArtistSection } from './components/ArtistSection'
import { ReleaseDetail } from './components/ReleaseDetail'
import { SettingsIcon, RefreshIcon, ShuffleIcon, ChevronIcon, RecordPlayer } from './components/icons'

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function progressText(progress: SyncProgress): string {
  if (progress.phase === 'years') {
    return `Retrieving original release years… ${progress.loaded.toLocaleString()} / ${progress.total.toLocaleString()}`
  }
  return `Fetching releases… ${progress.loaded.toLocaleString()} / ${progress.total.toLocaleString()}`
}

export default function App() {
  const [settings, setSettings] = useState<SettingsType | null>(loadSettings)
  const [theme, setTheme] = useState<ThemeId>(settings?.theme ?? 'midnight')
  const [showSettings, setShowSettings] = useState<boolean>(() => !loadSettings())
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const {
    releases,
    folders,
    masterYears,
    status,
    error,
    progress,
    fetchedAt,
    refresh,
    wipeCache,
  } = useCollection(settings)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useScrollLock(showSettings)

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounced(query, 150)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [folderId, setFolderId] = useState(0)
  const [artistSortMode, setArtistSortMode] = useState<ArtistSortMode>('chronological')
  const [selected, setSelected] = useState<DisplayRelease | null>(null)

  const accountKey = settings ? `${settings.username}\u0001${settings.token}` : ''

  useEffect(() => {
    // Reset the browsing state for a new account only. Keying on the whole
    // settings object would also wipe search/filters/sort whenever a
    // preference (e.g. the UI theme) changes for the same account.
    /* eslint-disable react-hooks/set-state-in-effect */
    setQuery('')
    setFilters(DEFAULT_FILTERS)
    setFolderId(0)
    setArtistSortMode('chronological')
    setSelected(null)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [accountKey])

  const folderReleases = useMemo(() => {
    if (folderId === 0) return releases
    return releases.filter((release) => (release.folder_id ?? 1) === folderId)
  }, [releases, folderId])

  const formats = useMemo(() => distinctFormats(folderReleases), [folderReleases])
  const genres = useMemo(() => distinctGenres(folderReleases), [folderReleases])
  const styles = useMemo(() => distinctStyles(folderReleases), [folderReleases])
  const labels = useMemo(() => distinctLabels(folderReleases), [folderReleases])
  const bounds = useMemo(() => yearBounds(folderReleases, masterYears), [folderReleases, masterYears])

  const filtered = useMemo(
    () => filterReleases(folderReleases, { ...filters, query: debouncedQuery }, masterYears),
    [folderReleases, filters, debouncedQuery, masterYears],
  )
  const grouped = useMemo(() => groupReleases(filtered, masterYears), [filtered, masterYears])

  const artistCount = grouped.length
  const totalMatching = filtered.length
  const uniqueMatching = useMemo(() => countUniqueAlbums(filtered), [filtered])

  const onSaveSettings = (newSettings: SettingsType) => {
    saveSettings({ ...newSettings, theme })
    setSettings({ ...newSettings, theme })
    setShowSettings(false)
  }

  const onThemeChange = (id: ThemeId) => {
    setTheme(id)
    const current = loadSettings()
    if (!current) {
      // No saved account yet: the choice lives in App state and persists on
      // the first settings save. Don't write empty credentials to storage.
      return
    }
    saveSettings({ ...current, theme: id })
    setSettings({ ...current, theme: id })
  }

  const onFolderChange = (id: number) => {
    setFolderId(id)
    setFilters(DEFAULT_FILTERS)
  }

  const pickRandom = useCallback(() => {
    if (filtered.length === 0) return
    const picked = filtered[Math.floor(Math.random() * filtered.length)]
    setSelected(toDisplayRelease(picked, masterYears))
  }, [filtered, masterYears])

  const onClearData = async () => {
    await wipeCache()
    clearSettings()
    setSettings(null)
    setShowSettings(true)
  }

  const isLoadingFirst = status === 'loading' && releases.length === 0
  const isLoadingFailed = status === 'error' && releases.length === 0

  return (
    <>
      {/* Full-screen settings (no saved settings, or opened from menu) */}
      {showSettings && (
        <div
          className="settings-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Settings"
          onClick={settings ? () => setShowSettings(false) : undefined}
        >
          <div className="settings-overlay-content" onClick={(e) => e.stopPropagation()}>
            <SettingsForm
              initial={settings ?? { username: '', token: '', theme }}
              theme={theme}
              onThemeChange={onThemeChange}
              onSave={onSaveSettings}
              onClose={settings ? () => setShowSettings(false) : undefined}
            >
              {settings && (
                <section className="advanced-section">
                  <button
                    type="button"
                    className="advanced-toggle"
                    onClick={() => setAdvancedOpen((open) => !open)}
                    aria-expanded={advancedOpen}
                    aria-controls="advanced-panel"
                  >
                    <span>Advanced</span>
                    <span className="collapse-indicator" aria-hidden="true">
                      <ChevronIcon direction={advancedOpen ? 'up' : 'down'} />
                    </span>
                  </button>
                  {advancedOpen && (
                    <div id="advanced-panel" className="advanced-body">
                      <StorageStats username={settings.username} onClearData={onClearData} />
                    </div>
                  )}
                </section>
              )}
            </SettingsForm>
          </div>
        </div>
      )}

      {/* First-load spinner */}
      {isLoadingFirst && (
        <div className="full-state">
          <RecordPlayer size={150} />
          <p>Loading your collection…</p>
          {progress && <p className="progress-text">{progressText(progress)}</p>}
        </div>
      )}

      {/* First-load error (no cached data) */}
      {isLoadingFailed && (
        <div className="full-state error">
          <div className="error-icon" role="img" aria-label="Error">
            !
          </div>
          <h2>Could not load your collection</h2>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button type="button" onClick={refresh}>
              Try again
            </button>
            <button type="button" onClick={() => setShowSettings(true)}>
              Change settings
            </button>
          </div>
        </div>
      )}

      {/* Main app (have data or background-refreshing) */}
      {!isLoadingFirst && !isLoadingFailed && settings && (
        <div className="app">
          <header className="app-header">
            <div className="header-top">
              <h1 className="app-title">Vinyl Vault</h1>
              <div className="header-actions">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={refresh}
                  disabled={status === 'loading'}
                  title="Refresh collection"
                  aria-label="Refresh collection"
                >
                  <RefreshIcon />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowSettings(true)}
                  title="Settings"
                  aria-label="Settings"
                >
                  <SettingsIcon />
                </button>
              </div>
            </div>
            <div className="header-meta">
              <span>{releases.length.toLocaleString()} releases</span>
              {fetchedAt && <span className="meta-separator">·</span>}
              {fetchedAt && <span>Last synced {formatTime(fetchedAt)}</span>}
            </div>
          </header>

          {status === 'loading' && releases.length > 0 && (
            <div className="sync-banner" aria-live="polite">
              Syncing…
              {progress && <span> {progressText(progress)}</span>}
            </div>
          )}

          {status === 'error' && releases.length > 0 && (
            <div className="sync-banner error" role="alert">
              Failed to refresh: {error}. Showing cached data.
              <button type="button" onClick={refresh}>
                Retry
              </button>
            </div>
          )}

          {folders.length > 0 && (
            <div className="folder-bar" role="tablist" aria-label="Collection folders">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  role="tab"
                  aria-selected={folderId === folder.id}
                  className={`folder-chip${folderId === folder.id ? ' active' : ''}`}
                  onClick={() => onFolderChange(folder.id)}
                >
                  <span className="folder-name">{folder.name}</span>
                  <span className="folder-count">{folder.count.toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}

          <div className="toolbar">
            <SearchBar value={query} onChange={setQuery} />
            <FiltersButton
              filters={filters}
              open={filtersOpen}
              onToggle={() => setFiltersOpen((open) => !open)}
            />
            <div className="global-sort">
              <span className="global-sort-label">Sort</span>
              <div className="sort-toggle" role="group" aria-label="Sort releases by">
                <button
                  className={artistSortMode === 'chronological' ? 'active' : ''}
                  onClick={() => setArtistSortMode('chronological')}
                  title="Oldest to newest within each artist"
                >
                  Year
                </button>
                <button
                  className={artistSortMode === 'byName' ? 'active' : ''}
                  onClick={() => setArtistSortMode('byName')}
                  title="By album name within each artist"
                >
                  A–Z
                </button>
              </div>
            </div>
          </div>

          {filtersOpen && (
            <FilterPanel
              filters={filters}
              formats={formats}
              genres={genres}
              styles={styles}
              labels={labels}
              bounds={bounds}
              onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
              onReset={() => setFilters(DEFAULT_FILTERS)}
            />
          )}

          <div className="summary">
            <p>
              {artistCount.toLocaleString()}
              {artistCount === 1 ? ' artist' : ' artists'}
              {' · '}
              {totalMatching.toLocaleString()}
              {totalMatching === 1 ? ' release' : ' releases'}
              {' · '}
              {uniqueMatching.toLocaleString()}
              {uniqueMatching === 1 ? ' unique album' : ' unique albums'}
            </p>
          </div>

          {grouped.length === 0 ? (
            <div className="full-state empty">
              <p>No releases match your search or filters.</p>
            </div>
          ) : (
            <div className="artist-list">
              {grouped.map((artist) => (
                <ArtistSection
                  key={artist.id}
                  artist={artist}
                  sortMode={artistSortMode}
                  onSelectRelease={setSelected}
                />
              ))}
            </div>
          )}
        </div>
      )}
    {/* Release detail overlay */}
      {selected && (
        <ReleaseDetail
          display={selected}
          token={settings?.token ?? ''}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Random picker (hidden while first-loading or when loading failed with no data) */}
      {!showSettings && !isLoadingFirst && !isLoadingFailed && (
        <button
          type="button"
          className="random-fab"
          onClick={pickRandom}
          disabled={filtered.length === 0}
          title="Pick a random release from what's shown"
          aria-label="Pick a random release from what's shown"
        >
          <ShuffleIcon size={20} />
        </button>
      )}
    </>
  )
}