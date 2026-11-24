import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useBiofilm, resetBiofilmCache } from '../useBiofilm'

const rows = [{ arr_nr: 1, title: 'Film One' }]

describe('useBiofilm', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    resetBiofilmCache()
    fetchMock = vi.fn().mockResolvedValue(rows)
    ;(globalThis as any).$fetch = fetchMock
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fetches /filmakt from the configured biofilm base with a timeout', async () => {
    await useBiofilm().loadFilmakt()
    expect(fetchMock).toHaveBeenCalledWith('https://tools.nbinfo.eu/biofilm/filmakt', { timeout: 10000 })
  })

  it('shares one request between callers, including concurrent ones', async () => {
    const [a, b] = await Promise.all([useBiofilm().loadFilmakt(), useBiofilm().loadFilmakt()])
    await useBiofilm().loadFilmakt()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(a).toBe(b)
  })

  it('refetches with force', async () => {
    await useBiofilm().loadFilmakt()
    await useBiofilm().loadFilmakt({ force: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('refetches once the cached data is from before the latest 06:30', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 0, 9, 23, 0))
    await useBiofilm().loadFilmakt()
    vi.setSystemTime(new Date(2026, 0, 10, 6, 0))
    await useBiofilm().loadFilmakt()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    vi.setSystemTime(new Date(2026, 0, 10, 6, 31))
    await useBiofilm().loadFilmakt()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not cache a failed request', async () => {
    fetchMock.mockRejectedValueOnce(new Error('timeout'))
    await expect(useBiofilm().loadFilmakt()).rejects.toThrow('timeout')
    await expect(useBiofilm().loadFilmakt()).resolves.toBe(rows)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('caches /pages separately from /filmakt', async () => {
    await useBiofilm().loadPages()
    await useBiofilm().loadPages()
    await useBiofilm().loadFilmakt()
    expect(fetchMock.mock.calls.map(c => c[0])).toEqual([
      'https://tools.nbinfo.eu/biofilm/pages',
      'https://tools.nbinfo.eu/biofilm/filmakt',
    ])
  })
})
