import { describe, it, expect } from 'vitest'
import { lastRefreshPoint, isStale } from '../useDailyRefresh'

describe('lastRefreshPoint', () => {
  it('is today 06:30 once that has passed', () => {
    expect(lastRefreshPoint(new Date(2026, 0, 10, 14, 0))).toEqual(new Date(2026, 0, 10, 6, 30))
  })

  it('is yesterday 06:30 before 06:30', () => {
    expect(lastRefreshPoint(new Date(2026, 0, 10, 6, 29))).toEqual(new Date(2026, 0, 9, 6, 30))
  })

  it('crosses month boundaries', () => {
    expect(lastRefreshPoint(new Date(2026, 2, 1, 1, 0))).toEqual(new Date(2026, 1, 28, 6, 30))
  })
})

describe('isStale', () => {
  it('is stale when loaded before the latest 06:30', () => {
    expect(isStale(new Date(2026, 0, 9, 23, 0), new Date(2026, 0, 10, 7, 0))).toBe(true)
  })

  it('is fresh when loaded after the latest 06:30', () => {
    expect(isStale(new Date(2026, 0, 10, 6, 31), new Date(2026, 0, 10, 23, 0))).toBe(false)
  })

  it('stays fresh overnight until 06:30', () => {
    expect(isStale(new Date(2026, 0, 9, 23, 0), new Date(2026, 0, 10, 6, 0))).toBe(false)
  })
})
