<template>
  <div class="container">
    <AppHeader />
    <div id="content">
      <slot />
    </div>
    <div id="footer">
      <h3>&copy; Copyright {{ currentYear }} <a href="https://svanekebio.dk/">Svaneke Bio</a>.</h3>
    </div>
  </div>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>
