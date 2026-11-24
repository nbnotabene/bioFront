// Refetch data loaded before the most recent daily refresh point (06:30, just after the
// 06:00 kultunaut sync), so an installed PWA or a tab left open overnight doesn't keep showing
// yesterday's programme. Pages only fetch in onMounted, which doesn't rerun when an app is resumed.

const REFRESH_HOUR = 6
const REFRESH_MINUTE = 30
const CHECK_INTERVAL_MS = 5 * 60 * 1000

/** The most recent refresh point (today 06:30 if that has passed, else yesterday 06:30), local time. */
export function lastRefreshPoint (now: Date, hour = REFRESH_HOUR, minute = REFRESH_MINUTE): Date {
  const point = new Date(now)
  point.setHours(hour, minute, 0, 0)
  if (point > now) point.setDate(point.getDate() - 1)
  return point
}

export function isStale (loadedAt: Date, now: Date): boolean {
  return loadedAt < lastRefreshPoint(now)
}

/**
 * Calls `refresh` when the page becomes visible again (resume, tab switch, back/forward cache)
 * or on a periodic check while visible, if data was last loaded before the latest refresh point.
 * The caller calls `markLoaded()` after each successful fetch.
 */
export function useDailyRefresh (refresh: () => Promise<unknown>) {
  let loadedAt: Date | null = null
  let inFlight = false
  let timer: ReturnType<typeof setInterval> | undefined

  function markLoaded () {
    loadedAt = new Date()
  }

  async function check () {
    if (inFlight || !loadedAt || document.visibilityState !== 'visible') return
    if (!isStale(loadedAt, new Date())) return
    inFlight = true
    try {
      await refresh()
    } finally {
      inFlight = false
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    window.addEventListener('pageshow', check)
    timer = setInterval(check, CHECK_INTERVAL_MS)
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', check)
    window.removeEventListener('focus', check)
    window.removeEventListener('pageshow', check)
    clearInterval(timer)
  })

  return { markLoaded, check }
}
