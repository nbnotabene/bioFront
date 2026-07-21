<template>
  <div ref="container" class="video-embed">
    <button type="button" class="video-fullscreen-toggle" @click="handleClick">
      Fullscreen
    </button>
    <iframe
      ref="iframeEl"
      :src="embedUrl"
      frameborder="0"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen
    />
  </div>
</template>

<style scoped>
.video-embed {
  position: relative;
  display: inline-block;
  width: 100%;
}

.video-fullscreen-toggle {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 3;
  padding: 0.35rem 0.7rem;
  border: 0;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  cursor: pointer;
  font-size: 0.85rem;
}

.video-embed iframe {
  display: block;
  width: 100%;
  min-height: 240px;
}
</style>

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

function handleClick () {
  toggleFullscreen()
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

onUnmounted(() => {
  // no-op kept for lifecycle symmetry
})
</script>
