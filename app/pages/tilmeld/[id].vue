<template>
  <!-- Sign-up to any maillist by its id, e.g. /tilmeld/1 (Bio-nyheder) -->
  <SubscribeForm :maillist-id="String(route.params.id)" />
</template>

<script setup lang="ts">
const route = useRoute()
</script>
