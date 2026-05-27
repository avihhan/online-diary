import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const AUDIO_EXT = /\.(mp3|ogg|m4a|wav|flac|aac|opus)$/i

/**
 * Scans `public/audio` for playable files and exposes them as a virtual
 * module: `import { tracks } from 'virtual:audio-tracks'`. Tracks update
 * automatically in dev when files are added or removed.
 */
function audioManifestPlugin() {
  const virtualId = 'virtual:audio-tracks'
  const resolvedId = '\0' + virtualId
  return {
    name: 'audio-manifest',
    resolveId(id) {
      if (id === virtualId) return resolvedId
      return null
    },
    load(id) {
      if (id !== resolvedId) return null
      const dir = path.resolve(__dirname, 'public/audio')
      let files = []
      try {
        files = fs.readdirSync(dir).filter((f) => AUDIO_EXT.test(f))
      } catch {
        files = []
      }
      files.sort((a, b) => a.localeCompare(b))
      // Use encodeURI (not encodeURIComponent): leaves commas, apostrophes,
      // parentheses untouched so Vite's static-file middleware can still match
      // the on-disk filename. Only escapes spaces and truly URL-unsafe chars.
      const tracks = files.map((f) => ({
        src: '/audio/' + encodeURI(f),
        name: f.replace(/\.[^.]+$/, ''),
        file: f,
      }))
      return `export const tracks = ${JSON.stringify(tracks)}`
    },
    configureServer(server) {
      const dir = path.resolve(__dirname, 'public/audio')
      try {
        fs.watch(dir, { persistent: false }, () => {
          const mod = server.moduleGraph.getModuleById(resolvedId)
          if (mod) {
            server.moduleGraph.invalidateModule(mod)
            server.ws.send({ type: 'full-reload' })
          }
        })
      } catch {
        /* dir missing -- ignore */
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), audioManifestPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei', '@react-spring/three'],
          mapbox: ['mapbox-gl'],
          framer: ['framer-motion'],
        },
      },
    },
  },
})
