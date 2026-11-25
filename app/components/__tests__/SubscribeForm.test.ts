import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import SubscribeForm from '../SubscribeForm.vue'

const list = { id: 1, name: 'Bio-nyheder', description: 'Svaneke Bio Nyhedsbrev', url: null }

describe('SubscribeForm', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn((url: string) => (url.endsWith('/maillist/public/1')
      ? Promise.resolve(list)
      : Promise.resolve({ status: 'check_mail' })))
    ;(globalThis as any).$fetch = fetchMock
  })

  it('names the list by its description and signs up with the honeypot field', async () => {
    const wrapper = mount(SubscribeForm, { props: { maillistId: 1 } })
    await flushPromises()
    expect(wrapper.find('h1').text()).toBe('Tilmeld dig Svaneke Bio Nyhedsbrev')

    await wrapper.find('#subscribe-email').setValue(' ny@x.dk ')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(fetchMock).toHaveBeenLastCalledWith('https://tools.nbinfo.eu/email/maillist/1/subscribe',
      { method: 'POST', body: { email: 'ny@x.dk', website: '' } })
    expect(wrapper.text()).toContain('Tjek din mail')
    expect(wrapper.text()).toContain('ny@x.dk')
  })

  it('shows the error from the API and keeps the form', async () => {
    fetchMock.mockImplementation((url: string) => (url.endsWith('/subscribe')
      ? Promise.reject({ statusCode: 429, data: { detail: 'For mange tilmeldinger. Prøv igen om lidt.' } })
      : Promise.resolve(list)))
    const wrapper = mount(SubscribeForm, { props: { maillistId: 1 } })
    await flushPromises()
    await wrapper.find('#subscribe-email').setValue('ny@x.dk')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.subscribe-error').text()).toBe('For mange tilmeldinger. Prøv igen om lidt.')
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('says so when the list does not exist', async () => {
    fetchMock.mockRejectedValue({ statusCode: 404 })
    const wrapper = mount(SubscribeForm, { props: { maillistId: 9 } })
    await flushPromises()
    expect(wrapper.find('.arr-notfound').text()).toBe('Listen blev ikke fundet.')
    expect(wrapper.find('form').exists()).toBe(false)
  })
})
