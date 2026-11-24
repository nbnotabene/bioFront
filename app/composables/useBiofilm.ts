import { isStale } from '~/composables/useDailyRefresh'

// Data from toolsapi's biofilm service (https://tools.nbinfo.eu/biofilm), read-only (GET).
// Field names match biofilm's FilmaktResponse / PageResponse.

export interface Filmakt {
  arr_nr: number
  ainfo_nr: string | null
  start: string
  title: string | null
  description: string | null
  long_description: string | null
  genre: string | null
  subgenre: string | null
  poster_url: string | null
  rating: string | null
  nautanb: string | null
  nautanmeld: string | null
  playdk: string | null
  extra: string | null
  is_locked: boolean
  created_at: string
  updated_at: string
  tmdb: string | null
}

export interface Page {
  id: number
  title: string
  fname: string
  pagehtml: string | null
  img: string | null
  created_at: string
}

interface CacheEntry {
  promise: Promise<unknown>
  loadedAt: Date
}

// Shared by all pages for the whole page load: one /filmakt (and one /pages) request, reused when
// navigating between the homepage and film pages. Refetched once it's from before the latest
// daily refresh point (06:30, see useDailyRefresh), and dropped if the request fails.
const cache = new Map<string, CacheEntry>()

/** For tests only. */
export function resetBiofilmCache () {
  cache.clear()
}

export function useBiofilm () {
  const { public: { biofilm } } = useRuntimeConfig()
  const apiBase = biofilm.apiBase
  // Reject instead of hanging forever when biofilm is unreachable, so pages can show an error
  const opts = { timeout: 10000 }

  function load<T> (path: string, force = false): Promise<T> {
    const hit = cache.get(path)
    if (hit && !force && !isStale(hit.loadedAt, new Date())) return hit.promise as Promise<T>
    const entry: CacheEntry = { promise: $fetch<T>(`${apiBase}${path}`, opts), loadedAt: new Date() }
    cache.set(path, entry)
    entry.promise.catch(() => {
      if (cache.get(path) === entry) cache.delete(path)
    })
    return entry.promise as Promise<T>
  }

  /** Upcoming screenings (one row per screening), sorted by start. */
  function loadFilmakt ({ force = false } = {}) {
    return load<Filmakt[]>('/filmakt', force)
  }

  /** Info pages, looked up by `fname` (e.g. omBio.html -> /pages/omBio). */
  function loadPages () {
    return load<Page[]>('/pages')
  }

  return { loadFilmakt, loadPages }
}
