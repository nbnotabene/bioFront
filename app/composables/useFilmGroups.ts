import type { Filmakt } from '~/composables/useNbapi'

export interface FilmGroup {
  /** arr_nr of the earliest showtime — used as the detail-page link target */
  arr_nr: number
  ainfo_nr: string | null
  title: string | null
  poster_url: string | null
  /** All showtimes for this film, sorted earliest first */
  showtimes: Filmakt[]
}

/**
 * Groups /filmakt rows by ainfo_nr so a film with several screenings renders
 * as one card with multiple showtimes. Rows with ainfo_nr === null are
 * standalone events (no other showtimes to group with) and each become their own group.
 */
export function groupFilmakt (films: Filmakt[]): FilmGroup[] {
  const groups = new Map<string, Filmakt[]>()
  let standaloneIndex = 0

  for (const film of films) {
    const key = film.ainfo_nr ?? `__standalone_${standaloneIndex++}`
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
    return {
      arr_nr: first.arr_nr,
      ainfo_nr: first.ainfo_nr,
      title: first.title,
      poster_url: first.poster_url,
      showtimes: sorted
    }
  }).sort((a, b) => a.showtimes[0].start.localeCompare(b.showtimes[0].start))
}
