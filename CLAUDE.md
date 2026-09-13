# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

bioFront is the frontend for https://svanekebio.dk (Svaneke Bio, a cinema). It's a Nuxt 4 + Vue 3 (Composition API) + PrimeVue + Tailwind SPA that is **statically generated** (`npx nuxi generate`) but fetches all its data **client-side at runtime** from a separate backend, `nbapi` (`https://nbapi.nbinfo.eu`, source at `/home/nb/www/nbapi`). Nothing dynamic is baked into the build — the same static build artifact is deployed to both the dev and prod sites (see `deploy.md`).

This is a rewrite/port of an older Jinja-based site (`/home/nb/www/kultlib`) — the CSS classes, component structure, and visual design intentionally match that original (`/home/nb/www/kultlib/webroot/css/*.css` and a prior Vue+Vite prototype at `/home/nb/www/kultlib/frontend/vue/`).

## Commands

```bash
npm install
npm run dev          # dev server at http://192.168.1.71:3000 (fixed host/port in nuxt.config.ts)
npm test             # vitest run (all tests)
npx vitest run app/composables/__tests__/useFilmGroups.test.ts   # single test file
npx nuxi generate     # static build -> .output/public (also symlinked as ./dist)
npx serve .output/public   # serve the static build locally
```

Override the API base without rebuilding:
```bash
NUXT_PUBLIC_NBAPI_API_BASE=https://nbapi.nbinfo.eu npm run dev
```

## Architecture

### Data flow: nbapi, not build-time content

There is no CMS/content layer in this repo. All film and info-page data comes from `nbapi` via `app/composables/useNbapi.ts` (`getFilmakt`, `getFilm`, `getPages`, `getPage`), typed by the `Filmakt` and `NbapiPage` interfaces defined there. Pages fetch in `onMounted`/`watch` (not `useAsyncData`/SSR fetch), track their own `loading`/`pending` ref, and render a not-found state on failure — see `app/pages/index.vue`, `app/pages/arr/[id].vue`, `app/pages/pages/[slug].vue` for the pattern.

Info pages are looked up by `fname` slug (e.g. `omBio.html` → route `/pages/omBio`), not by numeric id — `GET /pages/{id}` exists in the API but isn't used directly.

`nuxt.config.ts` has a `nitro:config` hook that fetches `/pages` and `/filmakt` from nbapi at **build time** to populate `nitro.prerender.routes` (so `/arr/{arr_nr}` and `/pages/{slug}` routes exist as static files after `nuxi generate`), independent of the client-side runtime fetching described above. If nbapi is unreachable during a build, this fails soft (`failOnError: false`, try/catch with a warning) rather than failing the build.

### Film grouping by `ainfo_nr` / title fallback

Each `/filmakt` row is a single screening (one `arr_nr` = one date/time). Multiple screenings of the same film share an `ainfo_nr` (Kultunaut's event id). `app/composables/useFilmGroups.ts` groups rows so the homepage shows one card per film with all its showtimes, instead of one card per screening.

`ainfo_nr` is sometimes missing from the source data for a given film (seen for e.g. "Dobbeltspil"). `sameFilm()`/`groupFilmakt()` handle this with a fallback: rows sharing an `ainfo_nr` are always grouped by that; rows where **both** sides lack `ainfo_nr` are grouped by normalized (trimmed, lowercased) title instead; a row with an `ainfo_nr` is never merged into a title-only group. Untitled rows with no `ainfo_nr` each stay standalone. This same logic (`sameFilm`) is reused on the arrangement page (`arr/[id].vue`) to find and list all sibling showtimes of the film currently being viewed.

If touching this: `ainfo_nr` must be exposed by nbapi's `/filmakt` endpoint (migration `/home/nb/www/nbapi/migrations/2026-07-09_filmakt_add_ainfo_nr.sql`); without it, grouping falls back to title-matching only.

### Film "extras" (badges/icons)

`Filmakt.extra` is a free-text, comma-separated tag field (e.g. `"star, 3D"`). `app/composables/useFilmExtras.ts` matches these tags exactly (case-insensitive) against `app/config/filmExtras.json` to resolve icon/description metadata, rendered via `FilmExtraIcons.vue`. Exact tag matching (not substring) is deliberate, so a title containing "3D" doesn't false-positive.

### Structure

```
app/
  app.vue                    # <NuxtLayout><NuxtPage /></NuxtLayout>
  layouts/default.vue        # header + #content slot + footer
  components/
    AppHeader.vue             # logo, burger menu, fullscreen overlay nav
    FilmCard.vue              # film card in the homepage grid
    FilmExtraIcons.vue         # renders extra/badge icons for a Filmakt row
    InfoBanner.vue             # dismissable info banner (persisted to localStorage)
    VideoEmbed.vue              # Vimeo/YouTube trailer embed, dblclick-to-fullscreen
  composables/
    useNbapi.ts               # typed fetch helpers + Filmakt/NbapiPage types (the API contract)
    useFilmGroups.ts           # groups /filmakt rows into one card per film
    useFilmExtras.ts            # resolves Filmakt.extra tags to icon metadata
  pages/
    index.vue                 # homepage: film grid (PrimeVue DataView)
    arr/[id].vue                # single film/screening page (id = arr_nr)
    pages/[slug].vue              # info page, slug = fname without .html
  plugins/sw.client.ts        # registers /sw.js service worker, client-only
  assets/css/                 # tailwind.css (entrypoint) + base-styles.css + bio.css (ported v1 theme)
test/setup.ts                # stubs Nuxt auto-imports (ref/computed/useRoute/useNbapi/NuxtLink/...) for unit tests
```

Tests live in `__tests__/` next to the code they cover, run with Vitest + `@vue/test-utils` (happy-dom). None hit the real nbapi — `useNbapi()` is mocked/stubbed via `test/setup.ts`, which stands in for Nuxt's auto-import and component-auto-registration machinery (a full Nuxt runtime isn't booted for tests).

### Explicitly not used

- **Vuetify** — dropped in favor of PrimeVue to avoid CSS conflicts and duplicate bundle weight; don't add it back or mix component libraries.
- **Vite config** — no separate Vite setup needed; it's Nuxt's built-in build engine, configured (where needed) under the `vite` key in `nuxt.config.ts`.

## Deploy

Two independent deploy targets from the same static build (`.output/public`), detailed in `deploy.md`:
- `local.svanekebio.dk` — dev/staging, nginx serves `.output/public` directly; deploy is manual `git pull && npm install && npx nuxi generate` on the server, no reload needed.
- `svanekebio.dk` — production, hosted on statichost.eu, auto-builds on push/merge to `main` (build command `npx nuxi generate`, publish dir `.output/public`).

`develop` is the active working branch; `main` is the production branch — release by merging `develop` into `main` and pushing.
