import process from 'node:process'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// toolsapi's biofilm service: all film/info-page data (fetched client-side, read-only)
const BIOFILM_API_BASE = 'https://tools.nbinfo.eu/biofilm'
import Aura from '@primeuix/themes/aura'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devServer: {
		host: '192.168.1.71',
		port: 3000
	},
	devtools: { enabled: true },
	app: {
		head: {
			link: [
				{ rel: 'icon', href: '/favicon.ico', type: 'image/x-icon' },
				{ rel: 'manifest', href: '/manifest.webmanifest' },
				// Film data is fetched client-side from biofilm; warm up DNS+TLS while the JS loads
				{ rel: 'preconnect', href: 'https://tools.nbinfo.eu', crossorigin: '' },
				{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' }
			]
		}
	},
	sourcemap: {
    // Debugging server-side errors in Node logs
    server: true, 

    // Set to false to hide source code and eliminate Vite sourcemap warnings
    client: false 
  },
	modules: [
		'@nuxtjs/tailwindcss',
		'@primevue/nuxt-module'
	],
	tailwindcss: {
		cssPath: '~/assets/css/tailwind.css'
	},
	primevue: {
		options: {
			theme: {
				preset: Aura // Other options include Lara or Nora from @primeuix/themes
			}
		}
	},
	runtimeConfig: {
		public: {
			biofilm: {
				// Override per build via NUXT_PUBLIC_BIOFILM_API_BASE (e.g. the local.svaneke.net preview's same-origin proxy)
				apiBase: BIOFILM_API_BASE
			},
			email: {
				// toolsapi's email service: maillist sign-up (/nyhedsbrev, /tilmeld/{id}). Override: NUXT_PUBLIC_EMAIL_API_BASE
				apiBase: 'https://tools.nbinfo.eu/email'
			}
		}
	},
	vite: {
		optimizeDeps: {
			include: [
				'@vue/devtools-core',
				'@vue/devtools-kit',
			]
		},
		build: {
			sourcemap: false,
			rollupOptions: {
				onwarn (warning, warn) {
					// Known upstream quirk: nuxt:module-preload-polyfill doesn't emit a
					// sourcemap for its injected import, which warns even though client
					// sourcemaps are disabled above (sourcemap.client: false).
					if (warning.plugin === 'nuxt:module-preload-polyfill') return
					warn(warning)
				}
			}
		}
	},
	// This enforces Static Site Generation (SSG) mode
	ssr: true,
	nitro: {
		static: true,
	    prerender: {
            concurrency: 1, // Reduces simultaneous API requests
            failOnError: false // Prevents the build from failing entirely if routes crash
        } 
	},
	hooks: {
		// Add a human-readable build time (Danish time) to /_nuxt/builds/latest.json, e.g.
		// "built": "2026-11-24 14:56:20 CET". Nuxt's outdated-build check only reads `id`.
		'nitro:init' (nitro) {
			nitro.hooks.hook('close', async () => {
				const file = join(nitro.options.output.publicDir, '_nuxt/builds/latest.json')
				try {
					const manifest = JSON.parse(await readFile(file, 'utf8'))
					manifest.built = new Intl.DateTimeFormat('sv-SE', {
						timeZone: 'Europe/Copenhagen',
						year: 'numeric', month: '2-digit', day: '2-digit',
						hour: '2-digit', minute: '2-digit', second: '2-digit',
						timeZoneName: 'short',
					}).format(new Date(manifest.timestamp))
					await writeFile(file, JSON.stringify(manifest))
				} catch (error) {
					console.warn('Could not add build time to latest.json:', error)
				}
			})
		},
		async 'nitro:config' (nitroConfig) {
			// Always an absolute URL reachable from the build machine, independent of the browser's apiBase
			const apiBase = process.env.BIOFILM_PRERENDER_BASE || BIOFILM_API_BASE

			nitroConfig.prerender ||= {}
			nitroConfig.prerender.routes ||= []
			// Maillist sign-up pages (other lists' /tilmeld/{id} work through the SPA fallback)
			nitroConfig.prerender.routes.push('/nyhedsbrev', '/tilmeld/1')

			try {
				const pagesResponse = await fetch(`${apiBase}/pages`, { signal: AbortSignal.timeout(5000) })
				if (pagesResponse.ok) {
					const pages = await pagesResponse.json() as { fname: string }[]
					const pageRoutes = pages.map(p => `/pages/${p.fname.replace(/\.html$/, '')}`)
					nitroConfig.prerender.routes.push(...pageRoutes)
				}
			} catch (error) {
				console.warn('Could not prefetch page routes from biofilm during startup:', error)
			}

			try {
				const filmaktResponse = await fetch(`${apiBase}/filmakt`, { signal: AbortSignal.timeout(5000) })
				if (filmaktResponse.ok) {
					const filmakt = await filmaktResponse.json() as { arr_nr: number }[]
					const filmRoutes = filmakt.map(f => `/arr/${f.arr_nr}`)
					nitroConfig.prerender.routes.push(...filmRoutes)
				}
			} catch (error) {
				console.warn('Could not prefetch filmakt routes from biofilm during startup:', error)
			}
		}
	}
})
