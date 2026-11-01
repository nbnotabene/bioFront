export interface Filmakt {
  arr_nr: number
  ainfo_nr: string | null
  start: string
  title: string | null
  description: string | null
  long_description: string | null
  genre: string | null
  subgenre: string | null
  poster_url: string | null
  rating: string | null
  nautanb: string | null
  nautanmeld: string | null
  playdk: string | null
  extra: string | null
  is_locked: boolean
  created_at: string
  updated_at: string
  tmdb: string | null
}

export interface NbapiPage {
  id: number
  title: string
  fname: string
  pagehtml: string | null
  img: string | null
  created_at: string
}

export function useNbapi () {
  const { public: { nbapi } } = useRuntimeConfig()
  const apiBase = nbapi.apiBase
  // Reject instead of hanging forever when nbapi is unreachable, so pages can show an error
  const opts = { timeout: 10000 }

  function getFilmakt () {
    return $fetch<Filmakt[]>(`${apiBase}/filmakt`, opts)
  }

  function getFilm (arrNr: string | number) {
    return $fetch<Filmakt>(`${apiBase}/filmakt/${arrNr}`, opts)
  }

  function getPages () {
    return $fetch<NbapiPage[]>(`${apiBase}/pages`, opts)
  }

  function getPage (id: string | number) {
    return $fetch<NbapiPage>(`${apiBase}/pages/${id}`, opts)
  }

  return { getFilmakt, getFilm, getPages, getPage }
}
