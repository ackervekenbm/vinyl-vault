import { useMemo, useState } from 'react'
import type { DisplayRelease, GroupedArtist, ArtistSortMode } from '../utils/collection'
import { countUniqueAlbums } from '../utils/collection'
import { compareSortKeys } from '../utils/sortName'
import { ReleaseCard } from './ReleaseCard'
import { ChevronIcon } from './icons'

interface ArtistSectionProps {
  artist: GroupedArtist
  sortMode: ArtistSortMode
  onSelectRelease: (display: DisplayRelease) => void
}

export function ArtistSection({ artist, sortMode, onSelectRelease }: ArtistSectionProps) {
  const [collapsed, setCollapsed] = useState(false)

  const sorted = useMemo(() => {
    const list = [...artist.releases]
    const yearOf = (display: (typeof list)[number]) => display.originalYear || display.year || 0
    if (sortMode === 'chronological') {
      list.sort(
        (a, b) =>
          yearOf(a) - yearOf(b) || compareSortKeys(a.titleKey, b.titleKey),
      )
    } else {
      list.sort(
        (a, b) => compareSortKeys(a.titleKey, b.titleKey) || yearOf(a) - yearOf(b),
      )
    }
    return list
  }, [artist.releases, sortMode])

  const thumbnail = sorted[0]?.coverImage

  const uniqueAlbums = useMemo(
    () => countUniqueAlbums(sorted.map((display) => display.release)),
    [sorted],
  )

  return (
    <section className="artist-section">
      <header
        className="artist-header"
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        aria-controls={`artist-${artist.id}`}
        onClick={() => setCollapsed((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setCollapsed((value) => !value)
          }
        }}
      >
        <span className="artist-avatar" aria-hidden="true">
          {thumbnail ? (
            <img src={thumbnail} alt="" loading="lazy" />
          ) : (
            artist.letter
          )}
        </span>

        <div className="artist-heading">
          <h2 className="artist-name">{artist.name}</h2>
          <span className="artist-count">
            {sorted.length} {sorted.length === 1 ? 'release' : 'releases'}
            {' · '}
            {uniqueAlbums} unique {uniqueAlbums === 1 ? 'album' : 'albums'}
          </span>
        </div>

        <span className="collapse-indicator" aria-hidden="true">
          <ChevronIcon direction={collapsed ? 'up' : 'down'} />
        </span>
      </header>

      {!collapsed && (
        <div className="artist-releases" id={`artist-${artist.id}`} role="region">
{sorted.map((display) => (
              <ReleaseCard
                key={display.key}
                display={display}
                onOpen={onSelectRelease}
              />
            ))}
        </div>
      )}
    </section>
  )
}