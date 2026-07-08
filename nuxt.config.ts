import Aura from '@primeuix/themes/aura'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module'
  ],
  primevue: {
    options: {
      theme: {
        preset: Aura // Other options include Lara or Nora from @primeuix/themes
      }
    }
  },
  // This enforces Static Site Generation (SSG) mode
  ssr: true,
  nitro: {
    static: true
  }
})
