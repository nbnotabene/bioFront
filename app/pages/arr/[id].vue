<template>
  <div class="arr-page">
    <div v-if="loading" class="arr-loading">
      <ProgressSpinner />
    </div>

    <div v-else-if="data" class="arr-layout">

      <!-- Left column: all content -->
      <div class="arr-main">
        <h1>{{ data.title }}</h1>

        <div class="arr-dates">
          <template v-for="showtime in showtimes" :key="showtime.arr_nr">
            <span
              v-if="showtime.arr_nr === data.arr_nr"
              :class="['arr-date', `arr-${showtime.arr_nr}`, { 'is-active': true }]"
            >
              <FilmExtraIcons :extra="showtime.extra" />
              {{ formatStart(showtime.start) }}
            </span>
            <NuxtLink
              v-else
              :to="`/arr/${showtime.arr_nr}`"
              :class="['arr-date', `arr-${showtime.arr_nr}`]"
            >
              <FilmExtraIcons :extra="showtime.extra" />
              {{ formatStart(showtime.start) }}
            </NuxtLink>
          </template>
        </div>

        <div class="arr-tags">
          <Tag v-if="data.subgenre" :value="data.subgenre" severity="warn" />
          <Tag v-if="data.rating" :value="data.rating" severity="warn" />
        </div>

        <p v-if="data.description" class="arr-beskrivelse">{{ data.description }}</p>

        <template v-if="data.long_description && data.long_description.trim() !== (data.description || '').trim()">
          <Divider />
          <div class="arr-lang" v-html="data.long_description"></div>
        </template>

        <template v-if="videoId">
		<!-- <p class="arr-trailer-hint">Dobbeltklik for at se trailer "Fuld skærm" &mdash; Esc for at returnere!</p> -->
          <VideoEmbed :video-id="videoId" />
        </template>

        <template v-if="director || cast.length">
          <Divider />
          <div class="arr-credits">
            <component
              :is="director.id ? 'a' : 'div'"
              v-if="director"
              class="arr-credit arr-credit-director"
              v-bind="director.id ? { href: `https://www.themoviedb.org/person/${director.id}`, target: '_blank', rel: 'noopener' } : {}"
            >
              <img
                v-if="director.profile_path"
                class="arr-credit-photo"
                :src="`https://image.tmdb.org/t/p/w185${director.profile_path}`"
                :alt="director.name"
              />
              <div v-else class="arr-credit-photo arr-credit-photo-placeholder" />
              <div class="arr-credit-info">
                <span class="arr-credit-name">{{ director.name }}</span>
                <span class="arr-credit-role">Instruktør</span>
              </div>
            </component>

            <component
              :is="actor.id ? 'a' : 'div'"
              v-for="actor in cast"
              :key="actor.id ?? actor.name"
              class="arr-credit"
              v-bind="actor.id ? { href: `https://www.themoviedb.org/person/${actor.id}`, target: '_blank', rel: 'noopener' } : {}"
            >
              <img
                v-if="actor.profile_path"
                class="arr-credit-photo"
                :src="`https://image.tmdb.org/t/p/w185${actor.profile_path}`"
                :alt="actor.name"
              />
              <div v-else class="arr-credit-photo arr-credit-photo-placeholder" />
              <div class="arr-credit-info">
                <span class="arr-credit-name">{{ actor.name }}</span>
                <span v-if="actor.character" class="arr-credit-role">{{ actor.character }}</span>
              </div>
            </component>
          </div>
        </template>

        <div class="arr-footer">
          <Divider />

          <div class="arr-links">
            <span class="arr-links-label">Relevante links:</span>
            <a v-if="tmdbData?.id" class="arr-link-tag" target="_blank" :href="`https://www.themoviedb.org/movie/${tmdbData.id}`">
              <Tag value="TheMovieDB" severity="warn" />
            </a>
            <a class="arr-link-tag" target="_blank" :href="`https://www.google.com/search?q=${encodeURIComponent((data.title || '') + ' film')}`">
              <Tag value="Google" severity="warn" />
            </a>
          </div>

          <div class="arr-share">
            <span class="arr-links-label">Del med andre:</span>
            <a class="arr-link-tag" href="#" @click.prevent="share('facebook')"><Tag value="Facebook" severity="warn" /></a>
            <a class="arr-link-tag" href="#" @click.prevent="share('mastodon')"><Tag value="Mastodon" severity="warn" /></a>
            <a class="arr-link-tag" target="_blank" :href="`https://www.kultunaut.dk/perl/share/type-nynaut/googlecal?ArrNr=${data.arr_nr}`"><Tag value="Google Calendar" severity="warn" /></a>
            <a class="arr-link-tag" :href="`https://www.kultunaut.dk/perl/share/type-nynaut/ical?ArrNr=${data.arr_nr}`"><Tag value="iCal" severity="warn" /></a>
            <a class="arr-link-tag" target="_blank" :href="`https://www.kultunaut.dk/perl/share/type-nynaut/mail?ArrNr=${data.arr_nr}`"><Tag value="Email" severity="warn" /></a>
          </div>
        </div>

        <div class="arr-clearfix"></div>
      </div>

      <!-- Right column: poster only -->
      <div class="arr-poster">
        <img :src="data.poster_url || '/img/biologo.png'" :alt="data.title || ''" />
      </div>

    </div>

    <div v-else class="arr-notfound">Arrangement ikke fundet.</div>
  </div>
</template>

<script setup lang="ts">
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'
import FilmExtraIcons from '~/components/FilmExtraIcons.vue'
import type { Filmakt } from '~/composables/useNbapi'
import { sameFilm } from '~/composables/useFilmGroups'

const route = useRoute()
const { getFilm, getFilmakt } = useNbapi()

const id = ref(route.params.id as string)
const data = ref<Filmakt | null>(null)
/** All showtimes for this film: every /filmakt row sharing ainfo_nr, or (when ainfo_nr is null) sharing its normalized title. */
const showtimes = ref<Filmakt[]>([])
const loading = ref(true)

interface TmdbCastMember {
  id?: number
  name: string
  character?: string
  profile_path?: string | null
  order?: number
}

interface TmdbCrewMember {
  id?: number
  name: string
  job: string
  profile_path?: string | null
}

const tmdbData = computed<{ id?: number, videoid?: string, casted?: TmdbCastMember[], crew?: TmdbCrewMember[] } | null>(() => {
  if (!data.value?.tmdb) return null
  try {
    return JSON.parse(data.value.tmdb)
  } catch {
    return null
  }
})

const videoId = computed(() => tmdbData.value?.videoid || null)

const director = computed(() => tmdbData.value?.crew?.find(c => c.job === 'Director') || null)

const cast = computed(() => {
  const casted = tmdbData.value?.casted
  if (!casted) return []
  return [...casted].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).slice(0, 7)
})

async function fetchData (arrId: string) {
  loading.value = true
  data.value = null
  showtimes.value = []
  try {
    const film = await getFilm(arrId)
    data.value = film

    if (film.ainfo_nr || film.title?.trim()) {
      const all = await getFilmakt()
      showtimes.value = all
        .filter(f => sameFilm(f, film))
        .sort((a, b) => a.start.localeCompare(b.start))
    } else {
      showtimes.value = [film]
    }
  } catch {
    data.value = null
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, (newId) => {
  id.value = newId as string
  fetchData(id.value)
}, { immediate: true })

function formatStart (start: string) {
  const d = new Date(start)
  if (Number.isNaN(d.getTime())) return start
  return d.toLocaleString('da-DK', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function share (platform: 'facebook' | 'mastodon') {
  const pageUrl = window.location.href

  if (platform === 'facebook') {
    // Kultunaut's facebook share proxy no longer works with Facebook's current
    // sharer, so we link straight to Facebook's own sharer with this page's URL.
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`
    window.open(url, '_blank', 'scrollbars=yes,resizable=0,width=560,height=600,alwaysRaised=yes')
    return
  }

  // Mastodon has no single fixed domain, so ask which instance to post from.
  const lastInstance = localStorage.getItem('mastodonInstance') || 'mastodon.social'
  const input = window.prompt('Hvilken Mastodon-instans bruger du? (fx mastodon.social)', lastInstance)
  if (!input) return
  const instance = input.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
  if (!instance) return
  localStorage.setItem('mastodonInstance', instance)

  const text = `${data.value?.title || ''} ${pageUrl}`.trim()
  const url = `https://${instance}/share?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'scrollbars=yes,resizable=1,width=560,height=600,alwaysRaised=yes')
}
</script>
