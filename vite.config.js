import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    // Génère un rapport visuel (treemap) du contenu de chaque chunk après
    // le build, ouvert automatiquement dans le navigateur. Purement
    // diagnostique — n'affecte pas le bundle de production lui-même.
    visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
})