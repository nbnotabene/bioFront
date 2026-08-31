import { describe, it, expect } from 'vitest'
import { groupFilmakt } from '../useFilmGroups'
import type { Filmakt } from '../useNbapi'

function film (overrides: Partial<Filmakt>): Filmakt {
  return {
    arr_nr: 1,
    ainfo_nr: null,
    start: '2026-01-01T18:00:00+01:00',
    title: 'Film',
    description: null,
    long_description: null,
    genre: null,
    subgenre: null,
    poster_url: null,
    rating: null,
    nautanb: null,
    nautanmeld: null,
    playdk: null,
    extra: null,
    is_locked: false,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
    tmdb: null,
    ...overrides,
  }
}

describe('groupFilmakt', () => {
  it('groups multiple showings of the same film by ainfo_nr into one group', () => {
    const films = [
      film({ arr_nr: 1, ainfo_nr: 'A1', title: 'Same Film', start: '2026-01-02T18:00:00+01:00' }),
      film({ arr_nr: 2, ainfo_nr: 'A1', title: 'Same Film', start: '2026-01-01T18:00:00+01:00' }),
    ]
    const groups = groupFilmakt(films)
    expect(groups).toHaveLength(1)
    expect(groups[0].showtimes).toHaveLength(2)
  })

  it('sorts showtimes within a group earliest first, and uses the earliest arr_nr for the link', () => {
    const films = [
      film({ arr_nr: 1, ainfo_nr: 'A1', start: '2026-01-05T18:00:00+01:00' }),
      film({ arr_nr: 2, ainfo_nr: 'A1', start: '2026-01-01T18:00:00+01:00' }),
    ]
    const [group] = groupFilmakt(films)
    expect(group.showtimes.map(s => s.arr_nr)).toEqual([2, 1])
    expect(group.arr_nr).toBe(2)
  })

  it('treats rows with ainfo_nr === null and different titles as standalone, one group each', () => {
    const films = [
      film({ arr_nr: 1, ainfo_nr: null, title: 'Standalone One' }),
      film({ arr_nr: 2, ainfo_nr: null, title: 'Standalone Two' }),
    ]
    const groups = groupFilmakt(films)
    expect(groups).toHaveLength(2)
    expect(groups.every(g => g.showtimes.length === 1)).toBe(true)
  })

  it('falls back to grouping by normalized title when ainfo_nr is null (missing from Kultunaut source)', () => {
    const films = [
      film({ arr_nr: 1, ainfo_nr: null, title: 'Dobbeltspil', start: '2026-09-10T19:45:00+01:00' }),
      film({ arr_nr: 2, ainfo_nr: null, title: ' dobbeltspil ', start: '2026-09-12T19:45:00+01:00' }),
      film({ arr_nr: 3, ainfo_nr: null, title: 'DOBBELTSPIL', start: '2026-09-13T16:00:00+01:00' }),
    ]
    const groups = groupFilmakt(films)
    expect(groups).toHaveLength(1)
    expect(groups[0].showtimes).toHaveLength(3)
  })

  it('never mixes a title-fallback group with rows that have an ainfo_nr', () => {
    const films = [
      film({ arr_nr: 1, ainfo_nr: null, title: 'Same Title' }),
      film({ arr_nr: 2, ainfo_nr: 'A1', title: 'Same Title' }),
    ]
    const groups = groupFilmakt(films)
    expect(groups).toHaveLength(2)
  })

  it('keeps untitled null-ainfo_nr rows standalone instead of merging them', () => {
    const films = [
      film({ arr_nr: 1, ainfo_nr: null, title: null }),
      film({ arr_nr: 2, ainfo_nr: null, title: null }),
    ]
    const groups = groupFilmakt(films)
    expect(groups).toHaveLength(2)
  })

  it('orders groups by their earliest showtime', () => {
    const films = [
      film({ arr_nr: 1, ainfo_nr: 'A1', title: 'Later', start: '2026-02-01T18:00:00+01:00' }),
      film({ arr_nr: 2, ainfo_nr: 'A2', title: 'Earlier', start: '2026-01-01T18:00:00+01:00' }),
    ]
    const groups = groupFilmakt(films)
    expect(groups.map(g => g.title)).toEqual(['Earlier', 'Later'])
  })
})
