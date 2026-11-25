<template>
  <!-- Svaneke Bio's newsletter (maillist 1, "Bio-nyheder") -->
  <SubscribeForm
    :maillist-id="BIO_NYHEDER"
    intro="Få besked om nye film, særforestillinger og arrangementer i Svaneke Bio direkte i din indbakke."
  />
</template>

<script setup lang="ts">
const BIO_NYHEDER = 1
</script>
