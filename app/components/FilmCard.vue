<template>
  <Card class="film-card">
    <template #header>
      <NuxtLink :to="`/arr/${group.arr_nr}`" class="film-card-link">
        <div class="film-card-header">
          <h3>{{ group.title }}</h3>
          <img
            :src="group.poster_url || '/img/biologo.png'"
            :alt="group.title || ''"
            class="film-poster"
          />
        </div>
      </NuxtLink>
    </template>
    <template #content>
      <div class="film-card-content">
        <div class="start-dates">
          <NuxtLink
            v-for="showtime in group.showtimes"
            :key="showtime.arr_nr"
            :to="`/arr/${showtime.arr_nr}`"
            :class="['start-date', `arr-${showtime.arr_nr}`]"
          >
            <FilmExtraIcons :extra="showtime.extra" />
            {{ formatStart(showtime.start) }}
          </NuxtLink>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import type { FilmGroup } from '~/composables/useFilmGroups'
import Card from 'primevue/card'
import FilmExtraIcons from '~/components/FilmExtraIcons.vue'

defineProps<{ group: FilmGroup }>()

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
</script>
