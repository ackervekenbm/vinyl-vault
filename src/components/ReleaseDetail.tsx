import { useEffect } from 'react'
import type { DisplayRelease } from '../utils/collection'
import { artistDisplayName, creditedArtists, effectiveYears } from '../utils/collection'
import { useReleaseTracklist } from '../hooks/useReleaseTracklist'
import { useScrollLock } from '../hooks/useScrollLock'

interface ReleaseDetailProps {
  display: DisplayRelease
  token: string
  onClose: () => void
}

export function ReleaseDetail({ display, token, onClose }: ReleaseDetailProps) {
  useScrollLock(true)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const basic = display.release?.basic_information
  const years = effectiveYears(display)
  const hasMaster = typeof basic?.master_id === 'number' && Boolean(basic?.master_url)

  const formats = basic?.formats ?? []
  const labels = basic?.labels ?? []
  const genres = basic?.genres ?? []
  const styles = basic?.styles ?? []
  const artists = basic?.artists ?? []

  const dateAdded = display.release?.date_added
  const rating = display.release?.rating ?? 0

  const { tracks, loading: tracksLoading, error: tracksError } = useReleaseTracklist(
    display.id,
    token,
  )

  return (
    <div
      className="detail-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${display.artistName} — ${display.title}`}
      onClick={onClose}
    >
      <div className="detail-card" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="card-close"
          onClick={onClose}
          aria-label="Close release details"
        >
          ×
        </button>

        {display.coverImage && (
          <div className="detail-cover">
            <img src={display.coverImage} alt={`${display.artistName} — ${display.title}`} />
          </div>
        )}

        <h2 className="detail-title">{creditedArtists(artists)}</h2>
        <p className="detail-album">{display.title}</p>

        {years.length > 0 && (
          <div className="detail-years">
            {years.map((line, index) => (
              <span className="detail-year" key={index}>
                {line.label && <span className="detail-year-label">{line.label}</span>}
                {line.value}
              </span>
            ))}
          </div>
        )}

        {formats.length > 0 && (
          <div className="detail-section">
            <span className="detail-section-title">Format</span>
            <p className="detail-row">
              {formats
                .map((format) => {
                  const descriptors = [
                    format.qty && format.qty !== '1' ? `${format.qty} ×` : '',
                    format.name,
                    ...(format.descriptions ?? []),
                  ]
                    .filter(Boolean)
                    .join(' · ')
                  return descriptors
                })
                .filter(Boolean)
                .join(' / ')}
            </p>
          </div>
        )}

        {labels.length > 0 && (
          <div className="detail-section">
            <span className="detail-section-title">Label</span>
            <p className="detail-row">
              {labels
                .map((label) => label.name + (label.catno ? ` · ${label.catno}` : ''))
                .join(' / ')}
            </p>
          </div>
        )}

        {(genres.length > 0 || styles.length > 0) && (
          <div className="detail-section">
            <span className="detail-section-title">Genre</span>
            <div className="detail-chips">
              {genres.map((genre) => (
                <span className="detail-chip" key={`g-${genre}`}>
                  {genre}
                </span>
              ))}
              {styles.map((style) => (
                <span className="detail-chip" key={`s-${style}`}>
                  {style}
                </span>
              ))}
            </div>
          </div>
        )}

        {artists.length > 0 && (
          <div className="detail-section">
            <span className="detail-section-title">Artists</span>
            <ul className="detail-credits">
              {artists.map((artist, index) => (
                <li key={index}>
                  {artistDisplayName(artist)}
                  {artist.role && <span className="detail-role"> — {artist.role}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {tracksLoading || tracks ? (
          <div className="detail-section">
            <span className="detail-section-title">Tracklist</span>
            {tracksLoading && !tracks && <p className="tracklist-note">Loading tracklist…</p>}
            {!tracksLoading && tracks && tracks.length === 0 && (
              <p className="tracklist-note">No tracklist available.</p>
            )}
            {tracks && tracks.length > 0 && (
              <ol className="tracklist">
                {tracks.map((track, index) => (
                  <li className="track" key={index}>
                    {track.position && <span className="track-position">{track.position}</span>}
                    <span className="track-body">
                      <span className="track-title">{track.title || 'Untitled'}</span>
                      {track.artists && track.artists.length > 0 && (
                        <span className="track-artists">{creditedArtists(track.artists)}</span>
                      )}
                    </span>
                    {track.duration && !/^[.\-\s]+$/.test(track.duration) && (
                      <span className="track-duration">{track.duration}</span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        ) : null}

        {tracksError && (
          <p className="tracklist-note">Couldn't load the tracklist: {tracksError}</p>
        )}

        <div className="detail-meta">
          {basic?.country && <span>{basic.country}</span>}
          {dateAdded && (
            <span>
              Added {new Date(dateAdded).toLocaleDateString([], {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
          {rating > 0 && <span>Rating {rating}/5</span>}
        </div>

        <div className="detail-links">
          <a
            href={`https://www.discogs.com/release/${display.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View release on Discogs ↗
          </a>
          {hasMaster && (
            <a
              href={`https://www.discogs.com/master/${basic?.master_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View master ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}