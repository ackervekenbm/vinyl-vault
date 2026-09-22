import type {
  DiscogsArtistRef,
  DiscogsCollectionRelease,
} from '../types/discogs'

export function artist(ref: Partial<DiscogsArtistRef> = {}): DiscogsArtistRef {
  return {
    id: 1,
    name: 'Test Artist',
    resource_url: '',
    anv: '',
    join: '',
    role: '',
    tracks: '',
    ...ref,
  }
}

export function release(
  override: Partial<DiscogsCollectionRelease> = {},
): DiscogsCollectionRelease {
  return {
    id: 100,
    instance_id: 1,
    date_added: '2020-01-01T00:00:00Z',
    rating: 4,
    basic_information: {
      id: 100,
      master_id: 900,
      master_url: 'https://api.discogs.com/masters/900',
      resource_url: 'https://api.discogs.com/releases/100',
      thumb: 'https://img.discogs.com/thumb.jpg',
      cover_image: 'https://img.discogs.com/cover.jpg',
      title: 'Test Album',
      year: 1985,
      genres: ['Rock'],
      styles: ['Indie Rock'],
      artists: [artist()],
      labels: [{ name: 'Test Label', catno: 'CAT-1', id: 1, resource_url: '' }],
      formats: [{ name: 'LP', qty: '1', descriptions: ['Album'] }],
    },
    ...override,
  }
}