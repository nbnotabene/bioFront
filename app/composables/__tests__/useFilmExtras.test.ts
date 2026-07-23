import { describe, it, expect } from 'vitest'
import { getFilmExtras } from '../useFilmExtras'

describe('getFilmExtras', () => {
  it('returns an empty array when extra is null, undefined, or empty', () => {
    expect(getFilmExtras(null)).toEqual([])
    expect(getFilmExtras(undefined)).toEqual([])
    expect(getFilmExtras('')).toEqual([])
  })

  it('matches a single tag', () => {
    const result = getFilmExtras('3D')
    expect(result.map(e => e.variabel)).toEqual(['3D'])
  })

  it('matches multiple comma-separated tags regardless of order and casing', () => {
    const result = getFilmExtras('star, 3d')
    expect(result.map(e => e.variabel).sort()).toEqual(['3D', 'star'])
  })

  it('does not match a tag that only appears as a substring of another word', () => {
    expect(getFilmExtras('3Dimensional')).toEqual([])
  })

  it('ignores unknown tags', () => {
    expect(getFilmExtras('imax')).toEqual([])
  })
})
