import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  site: 'https://jzorko.github.io',
  base: process.env.ASTRO_BASE || '/vsiljivec',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
