<template>
  <header>
    <div id="myNav" class="overlay" :style="{ width: navOpen ? '100%' : '0%' }">
      <a href="javascript:void(0)" class="closebtn" @click="closeNav">&times;</a>
      <div class="overlay-content">
        <NuxtLink to="/" @click="closeNav">Svaneke Bio - Film oversigt</NuxtLink>
        <NuxtLink to="/pages/nyt" @click="closeNav">Svaneke Bio - <b>Sidste nyt - sidste nyt!</b></NuxtLink>
        <NuxtLink to="/pages/omBio" @click="closeNav">Om Svaneke Bio</NuxtLink>
        <NuxtLink to="/pages/medlem" @click="closeNav">
          <span>
            Bliv medlem og få fordele!
            <img width="38" height="38" style="vertical-align:bottom" title="Bliv medlem"
              src="/img/megafon.png" class="infologos" />
          </span>
        </NuxtLink>
        <a target="_new" href="https://www.kultunaut.dk">
          <span>
            Kultunaut
            <img width="38" height="38" style="vertical-align:bottom" title="Kultunaut Local"
              src="/img/kultunaut.png" class="infologos" />
            (Arrangements-database)
          </span>
        </a>
        <a target="_new" href="https://www.facebook.com/Svaneke-Bio-1965202630369128/">
          <span>
            Facebook
            <img width="38" height="38" style="vertical-align:bottom" alt="Svaneke Bio på Facebook"
              src="/img/facebook.png" class="infologos" />
          </span>
        </a>
      </div>
    </div>
    <nav class="top-nav">
      <div class="sub left" id="biologo">
        <NuxtLink to="/">
          <img src="/img/biologo.png" alt="Svaneke Bio Logo" title="Svaneke Bio Logo" />
        </NuxtLink>
      </div>
      <div class="sub center" id="navmiddle"></div>
      <div class="sub right" id="navright">
        <i style="font-size:30px;cursor:pointer;vertical-align:bottom;" title="Bio Menu"
          @click="openNav" class="material-icons">menu</i>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
const navOpen = ref(false)

function openNav () { navOpen.value = true }
function closeNav () { navOpen.value = false }

function onKeydown (e: KeyboardEvent) {
  if (e.key === 'Escape') closeNav()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>
