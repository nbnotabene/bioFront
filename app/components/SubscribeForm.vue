<template>
  <!-- Sign-up to any maillist of toolsapi's email service: maillist-id picks the list -->
  <div class="subscribe">
    <h1>{{ title || `Tilmeld dig ${label}` }}</h1>
    <p v-if="intro" class="subscribe-intro">{{ intro }}</p>

    <div v-if="state === 'notfound'" class="arr-notfound">Listen blev ikke fundet.</div>

    <div v-else-if="state === 'done'" class="subscribe-done" role="status">
      <p><b>Tjek din mail.</b></p>
      <p>Vi har sendt en mail til <b>{{ sentTo }}</b>. Klik på linket i mailen for at bekræfte din tilmelding til {{ label }}.</p>
      <p class="subscribe-muted">Ingen mail? Kig i spam-mappen, eller <a href="#" @click.prevent="reset">prøv igen</a>.</p>
    </div>

    <form v-else class="subscribe-form" @submit.prevent="submit">
      <label for="subscribe-email">Din e-mail</label>
      <div class="subscribe-row">
        <input
          id="subscribe-email"
          v-model="email"
          type="email"
          name="email"
          autocomplete="email"
          required
          placeholder="navn@eksempel.dk"
          :disabled="state === 'sending'"
        />
        <button type="submit" :disabled="state === 'sending' || state === 'loading'">
          {{ state === 'sending' ? 'Sender …' : 'Tilmeld' }}
        </button>
      </div>
      <!-- Honeypot: hidden from people, so only bots fill it in -->
      <div class="subscribe-hp" aria-hidden="true">
        <label for="subscribe-website">Lad dette felt være tomt</label>
        <input id="subscribe-website" v-model="website" type="text" name="website" tabindex="-1" autocomplete="off" />
      </div>
      <p v-if="errorText" class="subscribe-error" role="alert">{{ errorText }}</p>
      <p class="subscribe-muted">Du får en mail med et link, som bekræfter tilmeldingen. Du kan altid afmelde dig igen via linket nederst i hver mail.</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { maillistLabel, useMaillist, type MaillistInfo } from '~/composables/useMaillist'

const props = defineProps<{
  maillistId: number | string
  // Default: "Tilmeld dig <the list's description>"
  title?: string
  intro?: string
}>()

const { loadMaillist, subscribe } = useMaillist()

const list = ref<MaillistInfo | null>(null)
const label = computed(() => maillistLabel(list.value))
const email = ref('')
const website = ref('')
const sentTo = ref('')
const errorText = ref('')
const state = ref<'loading' | 'ready' | 'sending' | 'done' | 'notfound'>('loading')

async function load () {
  state.value = 'loading'
  try {
    list.value = await loadMaillist(props.maillistId)
    state.value = 'ready'
  } catch (err: any) {
    // Unknown list: nothing to sign up to. Otherwise (offline etc.) the form still works without the name.
    state.value = err?.statusCode === 404 || err?.response?.status === 404 ? 'notfound' : 'ready'
  }
}

async function submit () {
  errorText.value = ''
  state.value = 'sending'
  try {
    await subscribe(props.maillistId, email.value.trim(), website.value)
    sentTo.value = email.value.trim()
    state.value = 'done'
  } catch (err: any) {
    const status = err?.statusCode ?? err?.response?.status
    errorText.value = status === 422
      ? 'Det ligner ikke en gyldig e-mailadresse.'
      : typeof err?.data?.detail === 'string' ? err.data.detail : 'Tilmeldingen mislykkedes. Prøv igen senere.'
    state.value = 'ready'
  }
}

function reset () {
  state.value = 'ready'
}

watch(() => props.maillistId, load, { immediate: true })
</script>

<style scoped>
.subscribe {
  max-width: 34rem;
  margin: 2em auto;
  padding: 0 1em;
  color: #fff;
}
.subscribe h1 {
  margin-bottom: 0.5em;
}
.subscribe-form label {
  display: block;
  margin-bottom: 0.3em;
  font-weight: bold;
}
.subscribe-row {
  display: flex;
  gap: 0.5em;
}
.subscribe-row input {
  flex: 1;
  min-width: 0;
  padding: 0.5em 0.7em;
  border-radius: 3px;
  border: 1px solid #ccc;
  font-size: 1rem;
  color: #222;
}
.subscribe-row button {
  background-color: #ff9800;
  color: white;
  border: none;
  padding: 0.5em 1.2em;
  border-radius: 3px;
  font-size: 1rem;
  cursor: pointer;
}
.subscribe-row button:hover {
  background-color: #fb8c00;
}
.subscribe-row button:disabled {
  opacity: 0.6;
  cursor: default;
}
.subscribe-hp {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
.subscribe-error {
  color: #ff8a80;
  margin-top: 0.7em;
}
.subscribe-muted {
  color: #bbb;
  font-size: 0.9em;
  margin-top: 1em;
}
.subscribe-muted a {
  color: #ffb74d;
}
.subscribe-done {
  background: rgba(255, 255, 255, 0.08);
  border-left: 4px solid #ff9800;
  padding: 1em 1.2em;
  border-radius: 3px;
}
</style>
