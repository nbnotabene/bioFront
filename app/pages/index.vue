<template>
  <div>
    <InfoBanner :message="infoMessage" />
    <div v-if="pending" class="arr-loading">
      <ProgressSpinner />
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
import type { Filmakt } from '~/composables/useNbapi'
import { groupFilmakt, type FilmGroup } from '~/composables/useFilmGroups'

const { getFilmakt } = useNbapi()

const filmGroups = ref<FilmGroup[]>([])
const pending = ref(true)

const infoMessage =
  'Har du lyst til at være støtte-medlem? Eller vælge din favoritfilm til visning i biografen? ' +
  'Check <a href="/pages/medlem">dette link</a>'

onMounted(async () => {
  try {
    const events: Filmakt[] = await getFilmakt()
    filmGroups.value = groupFilmakt(events)
  } finally {
    pending.value = false
  }
})
</script>
