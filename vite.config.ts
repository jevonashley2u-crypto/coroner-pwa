import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Coroner PWA',
        short_name: 'Coroner',
        description: 'Offline-first case management system',
        theme_color: '#1e2937',
        background_color: '#1e2937',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],

  build: {
    chunkSizeWarningLimit: 800,

    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'dexie', 'react-router-dom', 'zustand', '@supabase/supabase-js'],
        },
      },
    },
  },

  sourcemap: true,
});
