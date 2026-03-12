import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.svg', 'icons/icon-512.svg'],
      manifest: {
        name: 'Learning Tracker',
        short_name: 'LearnTrack',
        description: 'Track your progress across any learning roadmap. AI-powered quizzes, flashcards, and interview prep.',
        theme_color: '#7b5ea7',
        background_color: '#0f0f13',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache all app shell files
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // Cache API calls with network-first strategy (fall back to cache if offline)
        runtimeCaching: [
          {
            // Anthropic API — network only (can't cache AI responses meaningfully)
            urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Groq API — network only
            urlPattern: /^https:\/\/api\.groq\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Google Gemini — network only
            urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Everything else (CDN fonts, images etc.) — cache first
            urlPattern: /^https:\/\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
        // Don't cache the Anthropic API key or user data in service worker
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        // Enable PWA in dev mode so you can test it locally
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    host: true, // Expose to local network — useful for testing on a real phone
  },
})
