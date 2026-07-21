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
          <div v-for="showtime in showtimes" :key="showtime.arr_nr" class="arr-date">
            {{ formatStart(showtime.start) }}
          </div>
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

        <div class="arr-footer">
          <Divider />

          <div class="arr-links">
            <span class="arr-links-label">Relevante links:</span>
            <a class="arr-link-tag" target="_blank" :href="`https://www.google.com/search?q=${encodeURIComponent((data.title || '') + ' film')}`">
              <Tag value="Om filmen" severity="warn" />
            </a>
          </div>

          <div class="arr-share">
            <span class="arr-links-label">Del med andre:</span>
            <a class="arr-link-tag" href="#" @click.prevent="share('facebook')"><Tag value="Facebook" severity="warn" /></a>
            <a class="arr-link-tag" href="#" @click.prevent="share('twitter')"><Tag value="Twitter" severity="warn" /></a>
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
import type { Filmakt } from '~/composables/useNbapi'

const route = useRoute()
const { getFilm, getFilmakt } = useNbapi()

const id = ref(route.params.id as string)
const data = ref<Filmakt | null>(null)
/** All showtimes for this film: every /filmakt row sharing ainfo_nr, or just this row when ainfo_nr is null. */
const showtimes = ref<Filmakt[]>([])
const loading = ref(true)

const videoId = computed(() => {
  if (!data.value?.tmdb) return null
  try {
    const parsed = JSON.parse(data.value.tmdb)
    return parsed?.videoid || null
  } catch {
    return null
  }
})

async function fetchData (arrId: string) {
  loading.value = true
  data.value = null
  showtimes.value = []
  try {
    const film = await getFilm(arrId)
    data.value = film

    if (film.ainfo_nr) {
      const all = await getFilmakt()
      showtimes.value = all
        .filter(f => f.ainfo_nr === film.ainfo_nr)
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

function share (platform: 'facebook' | 'twitter') {
  const arrNr = data.value?.arr_nr
  const urls: Record<string, string> = {
    facebook: `https://www.kultunaut.dk/perl/share/type-nynaut/facebook?ArrNr=${arrNr}`,
    twitter: `https://www.kultunaut.dk/perl/share/type-nynaut/twitter?ArrNr=${arrNr}`
  }
  window.open(urls[platform], '_blank', 'scrollbars=yes,resizable=0,width=560,height=600,alwaysRaised=yes')
}
</script>
