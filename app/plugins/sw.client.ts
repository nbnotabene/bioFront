export default defineNuxtPlugin(() => {
  if (import.meta.client && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Registered successfully with scope:', registration.scope)

          registration.onupdatefound = () => {
            const installingWorker = registration.installing
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[SW] New version available, updating...')
                  installingWorker.postMessage({ type: 'SKIP_WAITING' })
                }
              }
            }
          }
        })
        .catch((error) => {
          console.error('[SW] Registration failed:', error)
        })
    })
  }
})
