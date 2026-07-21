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
		}
	},
	// This enforces Static Site Generation (SSG) mode
	ssr: true,
	nitro: {
		static: true
	},
	hooks: {
		async 'nitro:config' (nitroConfig) {
			const apiBase = nitroConfig.runtimeConfig?.public?.nbapi?.apiBase
				|| process.env.NUXT_PUBLIC_NBAPI_API_BASE
				|| 'https://nbapi.nbinfo.eu'

			try {
				const response = await fetch(`${apiBase}/pages`, { signal: AbortSignal.timeout(5000) })
				if (!response.ok) {
					throw new Error(`nbapi pages request failed with ${response.status}`)
				}

				const pages = await response.json() as { fname: string }[]
				const pageRoutes = pages.map(p => `/pages/${p.fname.replace(/\.html$/, '')}`)

				nitroConfig.prerender ||= {}
				nitroConfig.prerender.routes ||= []
				nitroConfig.prerender.routes.push(...pageRoutes)
			} catch (error) {
				console.warn('Could not prefetch page routes from nbapi during startup:', error)
			}
		}
	}
})
