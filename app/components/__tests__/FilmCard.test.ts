import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import FilmCard from '../FilmCard.vue'
import type { FilmGroup } from '~/composables/useFilmGroups'
import type { Filmakt } from '~/composables/useNbapi'

const group = {
  arr_nr: 42,
  ainfo_nr: '7106906',
  title: 'The Test Film',
  poster_url: 'https://example.com/poster.jpg',
  showtimes: [
    { arr_nr: 42, start: '2026-01-15T18:00:00+01:00' } as Filmakt,
    { arr_nr: 43, start: '2026-01-16T20:00:00+01:00' } as Filmakt,
  ],
} as FilmGroup

describe('FilmCard', () => {
  it('renders film title', () => {
    const wrapper = mount(FilmCard, { props: { group } })
    expect(wrapper.text()).toContain('The Test Film')
  })

  it('renders poster image with correct src and alt', () => {
    const wrapper = mount(FilmCard, { props: { group } })
    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe('https://example.com/poster.jpg')
    expect(img.attributes('alt')).toBe('The Test Film')
  })

  it('falls back to the site logo when poster_url is missing', () => {
    const wrapper = mount(FilmCard, { props: { group: { ...group, poster_url: null } } })
    expect(wrapper.find('img').attributes('src')).toBe('/img/biologo.png')
  })

  it('renders one formatted date per showtime', () => {
    const wrapper = mount(FilmCard, { props: { group } })
    expect(wrapper.findAll('.start-date')).toHaveLength(2)
  })

  it('uses dedicated layout containers for the card header and content', () => {
    const wrapper = mount(FilmCard, { props: { group } })
    expect(wrapper.find('.film-card-link').exists()).toBe(true)
    expect(wrapper.find('.film-card').exists()).toBe(true)
    expect(wrapper.find('.film-card-header').exists()).toBe(true)
    expect(wrapper.find('.film-card-content').exists()).toBe(true)
  })

  it('links to the earliest showtime\'s arrangement page', () => {
    const wrapper = mount(FilmCard, { props: { group } })
    const link = wrapper.find('a')
    expect(link.attributes('href')).toBe('/arr/42')
  })
})
