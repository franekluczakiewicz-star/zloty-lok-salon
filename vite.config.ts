import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages: https://franekluczakiewicz-star.github.io/zloty-lok-salon/
  base: process.env.NODE_ENV === 'production' ? '/zloty-lok-salon/' : '/',
  plugins: [react(), tailwindcss()],
})
