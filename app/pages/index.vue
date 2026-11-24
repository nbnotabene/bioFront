<template>
  <div>
    <InfoBanner :message="infoMessage" />
    <div v-if="pending" class="arr-loading">
      <ProgressSpinner />
    </div>
    <div v-else-if="error" class="arr-notfound">
      Kunne ikke hente programmet.
      <button type="button" class="retry-button" @click="load">Prøv igen</button>
    </div>
    <DataView v-else :value="filmGroups" layout="grid">
      <template #grid="{ items }">
        <ul class="film-grid">
          <li v-for="group in items as FilmGroup[]" :key="group.ainfo_nr ?? group.arr_nr">
            <FilmCard :group="group" />
          </li>
        </ul>
      </template>
    </DataView>
  </div>
</template>

<script setup lang="ts">
import DataView from 'primevue/dataview'
import ProgressSpinner from 'primevue/progressspinner'
import { groupFilmakt, type FilmGroup } from '~/composables/useFilmGroups'
import { useDailyRefresh } from '~/composables/useDailyRefresh'

const { loadFilmakt } = useBiofilm()

const filmGroups = ref<FilmGroup[]>([])
const pending = ref(true)
const error = ref(false)

const infoMessage =
  'Har du lyst til at være støtte-medlem? Eller vælge din favoritfilm til visning i biografen? ' +
  'Check <a href="/pages/medlem">dette link</a>'

const { markLoaded } = useDailyRefresh(refresh)

async function load () {
  pending.value = true
  error.value = false
  try {
    filmGroups.value = groupFilmakt(await loadFilmakt())
    markLoaded()
  } catch {
    error.value = true
  } finally {
    pending.value = false
  }
}

// Background daily refresh: no spinner, and keep showing the current programme if it fails.
async function refresh () {
  try {
    filmGroups.value = groupFilmakt(await loadFilmakt({ force: true }))
    error.value = false
    markLoaded()
  } catch {}
}

onMounted(load)
</script>
