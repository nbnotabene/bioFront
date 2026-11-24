<template>
  <div v-if="loading" class="arr-loading">
    <ProgressSpinner />
  </div>
  <div v-else-if="page" class="page">
    <div class="column items-center">
      <img v-if="page.img" :title="page.title" :src="`/img/${page.img}`" />
      <h1>{{ page.title }}</h1>
    </div>
    <div v-html="page.pagehtml"></div>
  </div>
  <div v-else class="arr-notfound">Siden blev ikke fundet.</div>
</template>

<script setup lang="ts">
import ProgressSpinner from 'primevue/progressspinner'
import type { Page } from '~/composables/useBiofilm'

const route = useRoute()
const { loadPages } = useBiofilm()

const page = ref<Page | null>(null)
const loading = ref(true)

async function fetchPage (slug: string) {
  loading.value = true
  page.value = null
  try {
    const pages = await loadPages()
    page.value = pages.find(p => p.fname === `${slug}.html`) || null
  } catch {
    page.value = null
  } finally {
    loading.value = false
  }
}

watch(() => route.params.slug, (newSlug) => {
  fetchPage(newSlug as string)
}, { immediate: true })
</script>
