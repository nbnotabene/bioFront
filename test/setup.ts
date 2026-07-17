import { computed, defineComponent, h, onMounted, onUnmounted, ref, watch } from 'vue'
import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import InfoBanner from '../app/components/InfoBanner.vue'
import FilmCard from '../app/components/FilmCard.vue'
import VideoEmbed from '../app/components/VideoEmbed.vue'

// Stub Nuxt's auto-imports so components/pages written against them can be
// unit-tested without booting a full Nuxt runtime. Vue's reactivity APIs are
// auto-imported by Nuxt too, so they're stubbed the same way as the Nuxt-only ones.
Object.assign(globalThis, { ref, computed, onMounted, onUnmounted, watch })

// Minimal NuxtLink stand-in: renders an <a> using the `to` prop, like vue-router's RouterLink.
;(globalThis as any).resolveComponent = () => undefined
const NuxtLinkStub = defineComponent({
  props: { to: { type: [String, Object], required: true } },
  setup (props, { slots }) {
    return () => h('a', { href: typeof props.to === 'string' ? props.to : props.to?.path }, slots.default?.())
  },
})
;(globalThis as any).NuxtLink = NuxtLinkStub

;(globalThis as any).useRoute = vi.fn(() => ({ params: {} }))
;(globalThis as any).useRuntimeConfig = vi.fn(() => ({
  public: { nbapi: { apiBase: 'https://nbapi.nbinfo.eu' } },
}))
;(globalThis as any).useNbapi = vi.fn()

// Global component registration standing in for Nuxt's component auto-import,
// so `<NuxtLink>` / `<InfoBanner>` / `<FilmCard>` / `<VideoEmbed>` resolve inside templates during mount.
config.global.components = { NuxtLink: NuxtLinkStub, InfoBanner, FilmCard, VideoEmbed }
