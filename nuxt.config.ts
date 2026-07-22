import process from 'node:process'
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
			nbapi: {
				// Override in dev/prod via NUXT_PUBLIC_NBAPI_API_BASE
				apiBase: 'https://nbapi.nbinfo.eu'
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
		async 'nitro:config' (nitroConfig) {
			const apiBase = nitroConfig.runtimeConfig?.public?.nbapi?.apiBase
				|| process.env.NUXT_PUBLIC_NBAPI_API_BASE
				|| 'https://nbapi.nbinfo.eu'			  

			nitroConfig.prerender ||= {}
			nitroConfig.prerender.routes ||= []

			try {
				const pagesResponse = await fetch(`${apiBase}/pages`, { signal: AbortSignal.timeout(5000) })
				if (pagesResponse.ok) {
					const pages = await pagesResponse.json() as { fname: string }[]
					const pageRoutes = pages.map(p => `/pages/${p.fname.replace(/\.html$/, '')}`)
					nitroConfig.prerender.routes.push(...pageRoutes)
				}
			} catch (error) {
				console.warn('Could not prefetch page routes from nbapi during startup:', error)
			}

			try {
				const filmaktResponse = await fetch(`${apiBase}/filmakt`, { signal: AbortSignal.timeout(5000) })
				if (filmaktResponse.ok) {
					const filmakt = await filmaktResponse.json() as { arr_nr: number }[]
					const filmRoutes = filmakt.map(f => `/arr/${f.arr_nr}`)
					nitroConfig.prerender.routes.push(...filmRoutes)
				}
			} catch (error) {
				console.warn('Could not prefetch filmakt routes from nbapi during startup:', error)
			}
		}
	}
})
