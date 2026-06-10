import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false,
      workbox: {
        // cacheia o app shell (JS, CSS, HTML)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          // TMDB API — stale-while-revalidate (retorna cache enquanto atualiza em background)
          {
            urlPattern: /^https:\/\/api\.themoviedb\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'tmdb-api',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 3 }, // 3 dias
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Posters e imagens TMDB — cache-first (imagens mudam raramente)
          {
            urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tmdb-images',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 dias
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // YouTube thumbnails — cache-first
          {
            urlPattern: /^https:\/\/img\.youtube\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'youtube-thumbs',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 dias
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
