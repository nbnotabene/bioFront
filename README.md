# bioFront

## Formål

https://svanekebio.dk er et responsive **website**, der viser kommende film i biografen — **Svaneke Bio** — og diverse info om og fra biografen.

**bioFront** er den nye system-version (version 2), der realiserer dette website, med samme visuelle udtryk som system-version 1 (`/home/nb/www/kultlib`), men bygget som en Nuxt + Vue + PrimeVue + Tailwind SPA der henter sit indhold fra toolsapi's **biofilm**-service (afløseren for `nbapi`) i stedet for at blive genereret server-side med Jinja.

## Arkitektur

Stack: **Nuxt 4** (SSG shell) · **Vue 3** (Composition API) · **PrimeVue** (UI-komponenter) · **Tailwind CSS** (utility styling)

Siden bygges statisk (`npx nuxi generate`), men alt filmdata og alle infosider **hentes client-side ved runtime** fra biofilm — ikke bagt ind i build'et. Det betyder:

- Statisk hostbar (ingen server-runtime nødvendig for selve frontend'en)
- Indhold er altid friskt — ingen rebuild nødvendig når en film eller side ændres i biofilm
- Dynamiske ruter som `/arr/{arr_nr}` behøver ikke være kendt ved build-tid

```
npx nuxi generate
   ┌────────────────────────────────────────────────────────┐
   │                        bioFront                        │
   └───────────────────────────┬────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
        [ Structural Layer ]            [ Visual Layer ]
          • Nuxt (SSG shell)              • PrimeVue (Components)
          • Vue 3 (Logic)                 • Tailwind CSS (Styling)
                │                               │
                └───────────────┬───────────────┘
                                ▼
                  Browser fetches from biofilm at runtime
                  • GET /filmakt, /filmakt/{arr_nr}
                  • GET /pages, /pages/{id}
```

Design-arven (farver, layout, header/overlay-menu) stammer fra `/home/nb/www/kultlib/webroot/css/*.css` og en tidligere Vue+Vite-prototype i `/home/nb/www/kultlib/frontend/vue/`, som bioFront er porteret fra — samme CSS-klasser og komponentstruktur, men flyttet til Nuxt's fil-baserede routing og koblet på API'et (nu biofilm) i stedet for statiske JSON-filer.

## Datakilde: biofilm (toolsapi)

API'et er dokumenteret i `/home/nb/www/toolsapi/services/biofilm/README.md` og køres på `https://tools.nbinfo.eu/biofilm` (docs: `https://tools.nbinfo.eu/biofilm/docs`). `GET`-endpoints er åbne (CORS tilladt for `https://svanekebio.dk`, `https://local.svanekebio.dk` og `https://biofront.statichost.page`); skrivende endpoints kræver SSO-superadmin og bruges ikke af bioFront.

| Endpoint | Bruges til |
|---|---|
| `GET /filmakt` | Alle kommende visninger: forside **og** arrangementsside (filmen findes på `arr_nr` i listen) |
| `GET /pages` | Infosider |

`app/composables/useBiofilm.ts` cacher begge svar for hele sidevisningen (én forespørgsel pr. endpoint, deles mellem sider) og henter igen, når data er fra før seneste kl. 06:30. `GET /filmakt/{arr_nr}` og `GET /pages/{id}` findes, men bruges ikke.

Infosider slås op i frontend på deres `fname`-slug (fx `omBio.html` → route `/pages/omBio`).

### Gruppering af visninger pr. film (`ainfo_nr`)

Hver række i `/filmakt` er én enkelt visning (ét `arr_nr` = én dato/tid). Flere visninger af samme film deler samme `ainfo_nr` (Kultunauts arrangements-id), mens `ainfo_nr = null` betyder et selvstændigt arrangement uden søsterrækker. `app/composables/useFilmGroups.ts` grupperer `/filmakt`-listen efter `ainfo_nr`, så forsiden viser ét filmkort med alle visningstidspunkter i stedet for ét kort pr. visning. Arrangementssiden (`arr/[id].vue`) gør det samme: den finder filmen i den (cachede) `/filmakt`-liste og viser alle rækker for samme film (`sameFilm()`: samme `ainfo_nr`, eller samme titel når `ainfo_nr` mangler).

## Projektstruktur

```
app/
  app.vue                    # rod: <NuxtLayout><NuxtPage /></NuxtLayout>
  layouts/
    default.vue              # header + content slot + footer
  components/
    AppHeader.vue            # logo, burger-menu, fuldskærms-overlay navigation
    FilmCard.vue              # filmkort i forsidens grid
    InfoBanner.vue             # dismissable infobanner (localStorage)
    VideoEmbed.vue              # Vimeo/YouTube trailer-embed m. dobbeltklik-fuldskærm
  composables/
    useBiofilm.ts             # cachede fetch-helpers mod biofilm (loadFilmakt, loadPages) + typer
    useFilmGroups.ts           # grupperer /filmakt-rækker pr. ainfo_nr (flere visninger = ét filmkort)
  pages/
    index.vue                 # forside: filmgrid (PrimeVue DataView)
    arr/[id].vue                # arrangementsside for én film (id = arr_nr)
    pages/[slug].vue              # infoside, slug = fname uden .html
  assets/css/
    tailwind.css                # Tailwind + porteret v1-tema (farver, header, overlay, filmgrid, arr-layout)
public/
  img/                         # logo, favicon, sociale ikoner (kopieret fra kultlib/webroot/img)
test/
  setup.ts                     # stubber Nuxt auto-imports til unit-tests
```

## Install — setup — kør

```bash
npm install

# Udvikling
npm run dev          # http://192.168.1.71:3000

# Test
npm test

# Statisk build
npx nuxi generate     # output i .output/public
npx serve .output/public 
# npm run preview       # preview af det statiske build
```

## Konfiguration

biofilm-base-URL'en er sat i `nuxt.config.ts` under `runtimeConfig.public.biofilm.apiBase` (default `https://tools.nbinfo.eu/biofilm`) og kan overstyres via miljøvariablen:

```bash
NUXT_PUBLIC_BIOFILM_API_BASE=https://tools.nbinfo.eu/biofilm npm run dev
```

Prerender-routes hentes ved build altid fra en absolut URL: `BIOFILM_PRERENDER_BASE` eller default'en.

## Test-cases

Testene ligger som `__tests__/`-mapper ved siden af den kode de dækker, og kører med Vitest + `@vue/test-utils` (happy-dom). Ingen af dem rammer det rigtige biofilm — `useBiofilm()` mockes (og `$fetch` i `useBiofilm.test.ts`).

| Fil | Dækker |
|---|---|
| `app/composables/__tests__/useFilmGroups.test.ts` | Grupperer visninger med samme `ainfo_nr`, sorterer visninger og grupper kronologisk, behandler `ainfo_nr = null` som selvstændige grupper |
| `app/components/__tests__/FilmCard.test.ts` | Titel, poster (inkl. fallback til logo når `poster_url` mangler), ét `.start-date` pr. visning i gruppen, link til den tidligste visnings `/arr/{arr_nr}` |
| `app/components/__tests__/InfoBanner.test.ts` | Vises som udgangspunkt, dismiss gemmes i `localStorage`, forbliver skjult efter reload, renderer HTML i beskeden |
| `app/components/__tests__/VideoEmbed.test.ts` | Vimeo- vs. YouTube-embed baseret på video-id-format |
| `app/pages/__tests__/index.test.ts` | Henter `/filmakt` ved mount, grupperer og renderer ét `FilmCard` pr. `ainfo_nr`, viser `InfoBanner` |
| `app/pages/arr/__tests__/[id].test.ts` | Loading-state, render af filmdata efter fetch, viser alle visninger der deler `ainfo_nr` (uden ekstra fetch når `ainfo_nr` er `null`), "ikke fundet"-visning ved fejl, trailer-embed når `tmdb.videoid` findes |
| `app/pages/pages/__tests__/[slug].test.ts` | Renderer matchende side ud fra `fname`-slug, "ikke fundet"-visning ved ukendt slug |

```bash
npm test
```

## Hvad der IKKE bruges

- ❌ **Vuetify** — droppet til fordel for PrimeVue for at undgå CSS-konflikter og dobbelt bundle-størrelse.
- ⚙️ **Vite** kræver ingen separat opsætning — det er Nuxt's indbyggede build-engine.
