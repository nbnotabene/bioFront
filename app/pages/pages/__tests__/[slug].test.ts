import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import SlugPage from '../[slug].vue'
import type { NbapiPage } from '~/composables/useNbapi'

const mockPages = [
  { id: 1, title: 'Om biografen', fname: 'omBio.html', pagehtml: '<p>Om Svaneke Bio</p>', img: null, created_at: '2026-01-01T00:00:00' },
  { id: 2, title: 'Bliv medlem', fname: 'medlem.html', pagehtml: '<p>Meld dig ind</p>', img: null, created_at: '2026-01-01T00:00:00' },
] as NbapiPage[]

describe('pages/[slug] page', () => {
  beforeEach(() => {
    ;(globalThis as any).useNbapi = vi.fn(() => ({
      getPages: vi.fn().mockResolvedValue(mockPages),
    }))
  })

  it('renders the matching page content by fname slug', async () => {
    ;(globalThis as any).useRoute = vi.fn(() => ({ params: { slug: 'omBio' } }))
    const wrapper = mount(SlugPage)
    await flushPromises()
    expect(wrapper.text()).toContain('Om biografen')
    expect(wrapper.html()).toContain('Om Svaneke Bio')
  })

  it('shows not-found message when no page matches the slug', async () => {
    ;(globalThis as any).useRoute = vi.fn(() => ({ params: { slug: 'unknown' } }))
    const wrapper = mount(SlugPage)
    await flushPromises()
    expect(wrapper.find('.arr-notfound').exists()).toBe(true)
  })
})
