import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Produkcja (GitHub Pages) musi mieć base z nazwą repo.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/zloty-lok-salon/' : '/',
  plugins: [react(), tailwindcss()],
}))
