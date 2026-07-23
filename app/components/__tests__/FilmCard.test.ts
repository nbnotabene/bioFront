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
  start: '2026-01-15T18:00:00+01:00',
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

  it('includes arr_nr CSS class on start-date element', () => {
    const wrapper = mount(FilmCard, { props: { group } })
    const startDates = wrapper.findAll('.start-date')
    expect(startDates[0].classes()).toContain('arr-42')
    expect(startDates[1].classes()).toContain('arr-43')
  })

  it('links each start-date to its own arrangement page', () => {
    const wrapper = mount(FilmCard, { props: { group } })
    const startDates = wrapper.findAll('.start-date')
    expect(startDates[0].attributes('href')).toBe('/arr/42')
    expect(startDates[1].attributes('href')).toBe('/arr/43')
  })

  it('renders 3D icon when showtime extra contains 3D', () => {
    const groupWith3D: FilmGroup = {
      ...group,
      showtimes: [
        { arr_nr: 100, start: '2026-01-15T18:00:00+01:00', extra: '3D' } as Filmakt
      ]
    }
    const wrapper = mount(FilmCard, { props: { group: groupWith3D } })
    const icon = wrapper.find('.icon-extra')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('src')).toBe('/img/3d.svg')
  })

  it('renders both icons when extra lists multiple tags', () => {
    const groupWithBoth: FilmGroup = {
      ...group,
      showtimes: [
        { arr_nr: 100, start: '2026-01-15T18:00:00+01:00', extra: 'star, 3D' } as Filmakt
      ]
    }
    const wrapper = mount(FilmCard, { props: { group: groupWithBoth } })
    expect(wrapper.findAll('.icon-extra')).toHaveLength(2)
  })
})
