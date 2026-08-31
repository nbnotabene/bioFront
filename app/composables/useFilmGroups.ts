import type { Filmakt } from '~/composables/useNbapi'

export interface FilmGroup {
  /** arr_nr of the earliest showtime — used as the detail-page link target */
  arr_nr: number
  ainfo_nr: string | null
  title: string | null
  poster_url: string | null
  /** Start time of the earliest showtime — used to sort groups */
  start: string
  /** All showtimes for this film, sorted earliest first */
  showtimes: Filmakt[]
}

export function normalizeTitle (title: string | null): string {
  return (title ?? '').trim().toLowerCase()
}

/** Whether two /filmakt rows belong to the same film: shared ainfo_nr, or (when both lack one) the same normalized, non-empty title. */
export function sameFilm (a: Pick<Filmakt, 'ainfo_nr' | 'title'>, b: Pick<Filmakt, 'ainfo_nr' | 'title'>): boolean {
  if (a.ainfo_nr || b.ainfo_nr) return a.ainfo_nr === b.ainfo_nr
  const title = normalizeTitle(a.title)
  return title !== '' && title === normalizeTitle(b.title)
}

/**
 * Groups /filmakt rows by ainfo_nr so a film with several screenings renders
 * as one card with multiple showtimes. The Kultunaut source sometimes omits
 * ainfo_nr for a film (seen e.g. for "Dobbeltspil"), so rows with
 * ainfo_nr === null fall back to grouping by normalized title instead of
 * each becoming their own group — this only groups null-ainfo_nr rows with
 * each other, never with rows that do have an ainfo_nr. Untitled null rows
 * each stay standalone rather than merging into one "untitled" group.
 */
export function groupFilmakt (films: Filmakt[]): FilmGroup[] {
  const groups = new Map<string, Filmakt[]>()
  let untitledIndex = 0

  for (const film of films) {
    const normalized = normalizeTitle(film.title)
    const key = film.ainfo_nr ?? (normalized ? `__title_${normalized}` : `__untitled_${untitledIndex++}`)
    const existing = groups.get(key)
    if (existing) {
      existing.push(film)
    } else {
      groups.set(key, [film])
    }
  }

  return Array.from(groups.values()).map((showtimes) => {
    const sorted = [...showtimes].sort((a, b) => a.start.localeCompare(b.start))
    const first = sorted[0]
    if (!first) throw new Error('groupFilmakt: encountered an empty showtime group')
    return {
      arr_nr: first.arr_nr,
      ainfo_nr: first.ainfo_nr,
      title: first.title,
      poster_url: first.poster_url,
      start: first.start,
      showtimes: sorted
    }
  }).sort((a, b) => a.start.localeCompare(b.start))
}
