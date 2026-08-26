import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' so the built app works correctly whether it's hosted at the
// domain root (Vercel/Netlify) or under a repo subpath (GitHub Pages)
export default defineConfig({
  plugins: [react()],
  base: './',
})
