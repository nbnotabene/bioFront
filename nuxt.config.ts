import Aura from '@primeuix/themes/aura'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devServer: {
		host: '192.168.1.71', // or a specific intranet IP
		port: 3000
	},
	devtools: { enabled: true },

	modules: [
		'@nuxtjs/tailwindcss',
		'@primevue/nuxt-module'
	],
	primevue: {
		options: {
			theme: {
				preset: Aura // Other options include Lara or Nora from @primeuix/themes
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
