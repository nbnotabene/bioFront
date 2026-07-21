<template>
  <NuxtLink :to="`/arr/${group.arr_nr}`" class="film-card-link">
    <Card class="film-card">
      <template #header>
        <div class="film-card-header">
          <h3>{{ group.title }}</h3>
          <img
            :src="group.poster_url || '/img/biologo.png'"
            :alt="group.title || ''"
            class="film-poster"
          />
        </div>
      </template>
      <template #content>
        <div class="film-card-content">
          <div class="start-dates">
            <div v-for="showtime in group.showtimes" :key="showtime.arr_nr" class="start-date">
              {{ formatStart(showtime.start) }}
            </div>
          </div>
        </div>
      </template>
    </Card>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { FilmGroup } from '~/composables/useFilmGroups'
import Card from 'primevue/card'

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
