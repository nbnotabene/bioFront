import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import IndexPage from '../index.vue'
import type { Filmakt } from '~/composables/useBiofilm'

const mockEvents = [
  { arr_nr: 1, ainfo_nr: 'A1', title: 'Film One', start: '2026-01-10T18:00:00+01:00', poster_url: null },
  { arr_nr: 2, ainfo_nr: 'A2', title: 'Film Two', start: '2026-01-11T20:00:00+01:00', poster_url: null },
  { arr_nr: 3, ainfo_nr: 'A2', title: 'Film Two', start: '2026-01-12T20:00:00+01:00', poster_url: null },
] as Filmakt[]

describe('index page', () => {
  beforeEach(() => {
    localStorage.clear()
    ;(globalThis as any).useBiofilm = vi.fn(() => ({
      loadFilmakt: vi.fn().mockResolvedValue(mockEvents),
    }))
  })

  it('fetches films on mount and renders one FilmCard per grouped film', async () => {
    const wrapper = mount(IndexPage)
    await flushPromises()
    expect(wrapper.text()).toContain('Film One')
    expect(wrapper.text()).toContain('Film Two')
    // 2 distinct ainfo_nr groups (A1, A2) even though A2 has two showtimes
    expect(wrapper.findAll('.film-card-link')).toHaveLength(2)
  })

  it('renders both showtimes for a film with multiple screenings', async () => {
    const wrapper = mount(IndexPage)
    await flushPromises()
    expect(wrapper.findAll('.start-date')).toHaveLength(3)
  })

  it('shows the InfoBanner', async () => {
    const wrapper = mount(IndexPage)
    await flushPromises()
    expect(wrapper.find('#temporary-info').exists()).toBe(true)
  })

  it('shows an error with a retry button when the fetch fails, and retries on click', async () => {
    const loadFilmakt = vi.fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(mockEvents)
    ;(globalThis as any).useBiofilm = vi.fn(() => ({ loadFilmakt }))

    const wrapper = mount(IndexPage)
    await flushPromises()
    expect(wrapper.find('.arr-notfound').text()).toContain('Kunne ikke hente programmet')
    expect(wrapper.find('.arr-loading').exists()).toBe(false)

    await wrapper.find('.retry-button').trigger('click')
    await flushPromises()
    expect(loadFilmakt).toHaveBeenCalledTimes(2)
    expect(wrapper.find('.arr-notfound').exists()).toBe(false)
    expect(wrapper.findAll('.film-card-link')).toHaveLength(2)
  })

  describe('daily refresh', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('refetches when the page becomes visible after 06:30 the next day, keeping the old list on failure', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date(2026, 0, 9, 23, 0))
      const loadFilmakt = vi.fn()
        .mockResolvedValueOnce(mockEvents)
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce([mockEvents[0]])
      ;(globalThis as any).useBiofilm = vi.fn(() => ({ loadFilmakt }))

      const wrapper = mount(IndexPage, { attachTo: document.body })
      await flushPromises()
      expect(loadFilmakt).toHaveBeenCalledTimes(1)

      // Still before 06:30: nothing to do
      vi.setSystemTime(new Date(2026, 0, 10, 6, 0))
      document.dispatchEvent(new Event('visibilitychange'))
      await flushPromises()
      expect(loadFilmakt).toHaveBeenCalledTimes(1)

      // After 06:30, refresh fails: the old programme stays, no error/spinner
      vi.setSystemTime(new Date(2026, 0, 10, 7, 0))
      document.dispatchEvent(new Event('visibilitychange'))
      await flushPromises()
      expect(loadFilmakt).toHaveBeenCalledTimes(2)
      expect(loadFilmakt).toHaveBeenLastCalledWith({ force: true })
      expect(wrapper.findAll('.film-card-link')).toHaveLength(2)
      expect(wrapper.find('.arr-notfound').exists()).toBe(false)
      expect(wrapper.find('.arr-loading').exists()).toBe(false)

      // Next attempt succeeds and replaces the programme
      window.dispatchEvent(new Event('focus'))
      await flushPromises()
      expect(loadFilmakt).toHaveBeenCalledTimes(3)
      expect(wrapper.findAll('.film-card-link')).toHaveLength(1)

      // Fresh again: no further fetches
      document.dispatchEvent(new Event('visibilitychange'))
      await flushPromises()
      expect(loadFilmakt).toHaveBeenCalledTimes(3)

      wrapper.unmount()
    })
  })
})
