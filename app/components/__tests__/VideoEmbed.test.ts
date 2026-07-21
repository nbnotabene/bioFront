import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import VideoEmbed from '../VideoEmbed.vue'

describe('VideoEmbed', () => {
  it('uses Vimeo embed for numeric video ID', () => {
    const wrapper = mount(VideoEmbed, { props: { videoId: '12345678' } })
    expect(wrapper.find('iframe').attributes('src')).toBe('https://player.vimeo.com/video/12345678')
  })

  it('uses YouTube embed for alphanumeric video ID', () => {
    const wrapper = mount(VideoEmbed, { props: { videoId: 'dQw4w9WgXcQ' } })
    expect(wrapper.find('iframe').attributes('src')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  it('uses YouTube embed for ID starting with letters', () => {
    const wrapper = mount(VideoEmbed, { props: { videoId: 'abc123' } })
    expect(wrapper.find('iframe').attributes('src')).toContain('youtube.com')
  })

  it('renders a fullscreen button for the embed', () => {
    const wrapper = mount(VideoEmbed, { props: { videoId: 'dQw4w9WgXcQ' } })
    expect(wrapper.find('.video-fullscreen-toggle').exists()).toBe(true)
  })

  it('toggles fullscreen when the embed container receives a click', () => {
    const wrapper = mount(VideoEmbed, { props: { videoId: 'dQw4w9WgXcQ' } })
    const requestFullscreen = vi.fn()
    const exitFullscreen = vi.fn()

    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null })
    Object.defineProperty(wrapper.vm.$el, 'requestFullscreen', { configurable: true, value: requestFullscreen })
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exitFullscreen })

    ;(wrapper.vm as any).handleClick()

    expect(requestFullscreen).toHaveBeenCalledTimes(1)
  })
})
