import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import InfoBanner from '../InfoBanner.vue'

describe('InfoBanner', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows message when not yet acknowledged', () => {
    const wrapper = mount(InfoBanner, { props: { message: 'Test message' } })
    expect(wrapper.find('#temporary-info').exists()).toBe(true)
    expect(wrapper.html()).toContain('Test message')
  })

  it('hides when localStorage key is already set', async () => {
    localStorage.setItem('info_acknowledged', 'true')
    const wrapper = mount(InfoBanner, { props: { message: 'Test message' } })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('#temporary-info').exists()).toBe(false)
  })

  it('dismisses on button click and saves to localStorage', async () => {
    const wrapper = mount(InfoBanner, { props: { message: 'Test message' } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('#temporary-info').exists()).toBe(false)
    expect(localStorage.getItem('info_acknowledged')).toBe('true')
  })

  it('renders message HTML', () => {
    const wrapper = mount(InfoBanner, { props: { message: 'Check <a href="/x">this</a>' } })
    expect(wrapper.find('a').exists()).toBe(true)
  })
})
