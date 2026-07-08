# Architecture

Stack: Nuxt, Vue, PrimeVue, Tailwind

1. Nuxt (The Orchestrator)
This is the main framework. We will run the command npx nuxi generate. Nuxt will crawl the pages, pull in any data we need, and generate a folder (.output/public) filled with pure, static HTML files ready for hosting.

2. Vue (The Core Language)We need this because Nuxt is built on top of it. We will write the logic and components using Vue 3 syntax (Composition API).  

3. PrimeVue (The UI Components)This is the design library. We will install @primevue/nuxt-module. It provides the pre-made elements (like Tabs, Dialogs, or Accordions) that will look beautiful on the static pages.

4. Tailwind CSS (The Utility Styling)This is highly recommended to pair with PrimeVue. In 2026, PrimeVue is designed to seamlessly connect with Tailwind CSS via its unstyled or token-based styling. We will use Tailwind to handle custom spacing, lawet alignments, and page-specific designs.  

What to Remove or Ignore

❌ Vuetify (Do Not Use) 
Since we chose PrimeVue, we should completely drop Vuetify. Mixing two large UI component libraries will bloat the bundle size, cause massive CSS conflicts, and ruin the loading speed of the static site.

⚙️ Vite (Already Included) 
We do not need to install or configure Vite separately. 
Vite is the default build engine built directly inside Nuxt. When we run the Nuxt project, Vite automatically handles all the fast compiling and 
tree-shaking behind the scenes.

Summary of the Final Blueprint for a STATIC site generation

```
npx nuxi generate
   ┌────────────────────────────────────────────────────────┐
   │                         MY APP                         │
   └───────────────────────────┬────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       [ Structural Layer ]            [ Visual Layer ]
         • Nuxt (SSG)                    • PrimeVue (Components)
         • Vue 3 (Logic)                 • Tailwind CSS (Styling)
               │                               │
               └───────────────┬───────────────┘
                               ▼
                    [ Hidden Engine Layer ]
                     • Vite (Auto-bundler)
```

## install - setup -run
```bash
npx nuxi@latest init my-static-site
cd my-static-site
npm install

npm install @primevue/nuxt-module @nuxtjs/tailwindcss

#RUN
npm run dev
npx nuxi generate
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module'
  ],
  primevue: {
    options: {
      theme: {
        preset: 'Aura' // Other options include 'Lara' or 'Nora'
      }
    }
  },
  // This enforces Static Site Generation (SSG) mode
  ssr: true, 
  nitro: {
    static: true
  }
})
```
