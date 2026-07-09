import Aura from '@primeuix/themes/aura'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devServer: {
		host: '192.168.1.71', // or a specific intranet IP
		port: 3000
	},
	devtools: { enabled: true },
	app: {
		head: {
			link: [
				{ rel: 'icon', href: '/favicon.ico', type: 'image/x-icon' },
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
				apiBase: 'https://local.nbinfo.eu/nbapi'
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
	}
})
