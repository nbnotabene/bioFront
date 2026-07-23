import filmExtrasConfig from '~/config/filmExtras.json'

export interface FilmExtra {
  variabel: string
  ikon: string
  description: string
}

const extras = filmExtrasConfig as FilmExtra[]

/**
 * Splits a Filmakt's `extra` field ("star, 3D") into its configured icon
 * definitions, matching each comma-separated tag exactly (case-insensitive)
 * against filmExtras.json so unrelated substrings (e.g. a title containing "3D") don't false-positive.
 */
export function getFilmExtras (extra: string | null | undefined): FilmExtra[] {
  if (!extra) return []
  const tags = extra.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean)
  return extras.filter(e => tags.includes(e.variabel.toLowerCase()))
}
