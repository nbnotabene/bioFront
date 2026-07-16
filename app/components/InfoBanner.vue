<template>
  <div v-if="visible" id="temporary-info" class="inforow">
    <p v-html="message"></p>
    <button title="OK & Luk" @click="dismiss">X</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message: string }>()

const STORAGE_KEY = 'info_acknowledged'
const visible = ref(true)

onMounted(() => {
  if (localStorage.getItem(STORAGE_KEY) === 'true') visible.value = false
})

function dismiss () {
  localStorage.setItem(STORAGE_KEY, 'true')
  visible.value = false
}
</script>
