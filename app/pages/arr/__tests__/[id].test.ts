import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ArrPage from '../[id].vue'
import type { Filmakt } from '~/composables/useNbapi'

const mockFilm = {
  arr_nr: 999,
  ainfo_nr: null,
  title: 'Test Movie',
  subgenre: 'Drama',
  rating: 'A',
  description: 'A great movie',
  long_description: null,
  start: '2026-01-01T18:00:00+01:00',
  poster_url: null,
  tmdb: null,
} as Filmakt

describe('arr/[id] page', () => {
  beforeEach(() => {
    ;(globalThis as any).useRoute = vi.fn(() => ({ params: { id: '999' } }))
  })

  it('shows loading state initially', () => {
    ;(globalThis as any).useNbapi = vi.fn(() => ({
      getFilm: vi.fn(() => new Promise(() => {})),
      getFilmakt: vi.fn(() => new Promise(() => {})),
    }))
    const wrapper = mount(ArrPage)
    expect(wrapper.find('.arr-loading').exists()).toBe(true)
  })

  it('renders film data after fetch', async () => {
    ;(globalThis as any).useNbapi = vi.fn(() => ({
      getFilm: vi.fn().mockResolvedValue(mockFilm),
      getFilmakt: vi.fn().mockResolvedValue([mockFilm]),
    }))
    const wrapper = mount(ArrPage)
    await flushPromises()
    expect(wrapper.text()).toContain('Test Movie')
    expect(wrapper.text()).toContain('Drama')
    expect(wrapper.text()).toContain('A great movie')
  })

  it('shows a single date when ainfo_nr and title are both empty (standalone event, no /filmakt refetch)', async () => {
    const getFilmakt = vi.fn()
    ;(globalThis as any).useNbapi = vi.fn(() => ({
      getFilm: vi.fn().mockResolvedValue({ ...mockFilm, title: null }),
      getFilmakt,
    }))
    const wrapper = mount(ArrPage)
    await flushPromises()
    expect(wrapper.findAll('.arr-date')).toHaveLength(1)
    expect(getFilmakt).not.toHaveBeenCalled()
  })

  it('shows every showtime sharing a normalized title when ainfo_nr is null (Kultunaut omitted it)', async () => {
    const allFilmakt = [
      { ...mockFilm, arr_nr: 20259236, title: 'Dobbeltspil', start: '2026-09-10T19:45:00+01:00' },
      { ...mockFilm, arr_nr: 20259237, title: 'Dobbeltspil', start: '2026-09-12T19:45:00+01:00' },
      { ...mockFilm, arr_nr: 20259238, title: 'Dobbeltspil', start: '2026-09-13T16:00:00+01:00' },
      { ...mockFilm, arr_nr: 1, title: 'Some Other Film', start: '2026-09-11T19:45:00+01:00' },
    ]
    ;(globalThis as any).useRoute = vi.fn(() => ({ params: { id: '20259236' } }))
    ;(globalThis as any).useNbapi = vi.fn(() => ({
      getFilm: vi.fn().mockResolvedValue(allFilmakt[0]),
      getFilmakt: vi.fn().mockResolvedValue(allFilmakt),
    }))
    const wrapper = mount(ArrPage)
    await flushPromises()
    expect(wrapper.findAll('.arr-date')).toHaveLength(3)
  })

  it('shows every showtime sharing ainfo_nr when the film has multiple screenings', async () => {
    const grouped = { ...mockFilm, arr_nr: 5, ainfo_nr: 'A1' }
    const allFilmakt = [
      { ...grouped, arr_nr: 5, start: '2026-01-05T18:00:00+01:00' },
      { ...grouped, arr_nr: 6, start: '2026-01-06T18:00:00+01:00' },
      { arr_nr: 7, ainfo_nr: 'OTHER', start: '2026-01-07T18:00:00+01:00' },
    ]
    ;(globalThis as any).useNbapi = vi.fn(() => ({
      getFilm: vi.fn().mockResolvedValue(grouped),
      getFilmakt: vi.fn().mockResolvedValue(allFilmakt),
    }))
    const wrapper = mount(ArrPage)
    await flushPromises()
    expect(wrapper.findAll('.arr-date')).toHaveLength(2)
  })

  it('shows not-found message when fetch fails', async () => {
    ;(globalThis as any).useNbapi = vi.fn(() => ({
      getFilm: vi.fn().mockRejectedValue(new Error('not found')),
      getFilmakt: vi.fn(),
    }))
    const wrapper = mount(ArrPage)
    await flushPromises()
    expect(wrapper.find('.arr-notfound').exists()).toBe(true)
  })

  it('renders VideoEmbed when tmdb videoid is present', async () => {
    ;(globalThis as any).useNbapi = vi.fn(() => ({
      getFilm: vi.fn().mockResolvedValue({ ...mockFilm, tmdb: JSON.stringify({ videoid: '12345678' }) }),
      getFilmakt: vi.fn().mockResolvedValue([mockFilm]),
    }))
    const wrapper = mount(ArrPage)
    await flushPromises()
    const iframe = wrapper.find('iframe')
    expect(iframe.exists()).toBe(true)
    expect(iframe.attributes('src')).toContain('vimeo.com')
  })

  it('includes arr_nr class and 3D icon on arr-date when extra contains 3D', async () => {
    const film3D = { ...mockFilm, arr_nr: 20164330, extra: '3D' }
    ;(globalThis as any).useNbapi = vi.fn(() => ({
      getFilm: vi.fn().mockResolvedValue(film3D),
      getFilmakt: vi.fn().mockResolvedValue([film3D]),
    }))
    const wrapper = mount(ArrPage)
    await flushPromises()
    const arrDate = wrapper.find('.arr-date')
    expect(arrDate.classes()).toContain('arr-20164330')
    const icon = arrDate.find('.icon-extra')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('src')).toBe('/img/3d.svg')
  })

  it('marks the currently loaded showtime as active among its siblings', async () => {
    const grouped = { ...mockFilm, arr_nr: 5, ainfo_nr: 'A1' }
    const allFilmakt = [
      { ...grouped, arr_nr: 5, start: '2026-01-05T18:00:00+01:00' },
      { ...grouped, arr_nr: 6, start: '2026-01-06T18:00:00+01:00' },
    ]
    ;(globalThis as any).useRoute = vi.fn(() => ({ params: { id: '5' } }))
    ;(globalThis as any).useNbapi = vi.fn(() => ({
      getFilm: vi.fn().mockResolvedValue(grouped),
      getFilmakt: vi.fn().mockResolvedValue(allFilmakt),
    }))
    const wrapper = mount(ArrPage)
    await flushPromises()
    const arrDates = wrapper.findAll('.arr-date')
    expect(arrDates[0]!.classes()).toContain('is-active')
    expect(arrDates[1]!.classes()).not.toContain('is-active')
    expect(arrDates[0]!.element.tagName).toBe('SPAN')
    expect(arrDates[1]!.attributes('href')).toBe('/arr/6')
  })
})
