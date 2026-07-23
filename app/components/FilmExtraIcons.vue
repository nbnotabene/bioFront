<template>
  <img
    v-for="item in getFilmExtras(extra)"
    :key="item.variabel"
    :src="item.ikon"
    :alt="item.variabel"
    :title="item.description"
    class="icon-extra"
  />
</template>

<script setup lang="ts">
import { getFilmExtras } from '~/composables/useFilmExtras'

defineProps<{ extra?: string | null }>()
</script>
