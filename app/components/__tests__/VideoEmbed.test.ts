import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
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
})
