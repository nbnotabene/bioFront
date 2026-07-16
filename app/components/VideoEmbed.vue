<template>
  <div ref="container" class="video-embed">
    <iframe
      ref="iframeEl"
      :src="embedUrl"
      frameborder="0"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ videoId: string | number }>()

const container = ref<HTMLElement | null>(null)
const iframeEl = ref<HTMLIFrameElement | null>(null)

// Vimeo IDs are pure integers; YouTube IDs contain letters
const embedUrl = computed(() => {
  const asNum = Number(props.videoId)
  return Number.isInteger(asNum) && asNum !== 0
    ? `https://player.vimeo.com/video/${props.videoId}`
    : `https://www.youtube.com/embed/${props.videoId}`
})

// Detect double-click inside iframe via window blur events:
// each click inside the iframe steals focus → window.blur fires.
// Two blur events while activeElement is the iframe within ~350ms = double-click.
let dblClickTimer: ReturnType<typeof setTimeout> | null = null

function onWindowBlur () {
  if (document.activeElement !== iframeEl.value) return

  if (dblClickTimer) {
    clearTimeout(dblClickTimer)
    dblClickTimer = null
    toggleFullscreen()
    window.focus()
  } else {
    dblClickTimer = setTimeout(() => { dblClickTimer = null }, 350)
  }
}

function toggleFullscreen () {
  const el = container.value
  if (!el) return
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    el.requestFullscreen?.()
  }
}

onMounted(() => window.addEventListener('blur', onWindowBlur, true))
onUnmounted(() => {
  window.removeEventListener('blur', onWindowBlur, true)
  if (dblClickTimer) clearTimeout(dblClickTimer)
})
</script>
