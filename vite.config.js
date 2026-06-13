import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Pull icon/head-link config from pwa-assets.config.js.
      pwaAssets: { config: true },
      // Make the installed app work offline.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
      manifest: {
        name: 'PubTrail — Track Your Crawl',
        short_name: 'PubTrail',
        description: 'Track your pub crawl like Strava: route, time per pub, and pints.',
        theme_color: '#1a0f08',
        background_color: '#160d07',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        categories: ['lifestyle', 'social'],
      },
    }),
  ],
})
