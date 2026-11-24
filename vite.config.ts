import { rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  base: './',
  resolve: { alias: mode === 'poki' ? [{
    find: './game/leaderboard', replacement: fileURLToPath(new URL('./src/game/leaderboardPoki.ts', import.meta.url)),
  }] : [] },
  plugins: [react(), {
    name: 'poki-clean-public-assets',
    writeBundle() {
      if (mode !== 'poki') return
      // Public includes source references and unused artwork; don't ship them.
      for (const name of ['README.md', 'LayeredBackground.ts', 'layers.json', 'preview-composite.png']) {
        rmSync(fileURLToPath(new URL('./dist-poki/assets/bcg_layers/' + name, import.meta.url)), { force: true })
      }
    },
  }],
  build: { outDir: mode === 'poki' ? 'dist-poki' : 'dist' },
}))
