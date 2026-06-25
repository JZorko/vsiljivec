import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  site: 'https://jzorko.github.io',
  base: process.env.ASTRO_BASE || '/vsiljivec',
  integrations: [react(), tailwind()],
});
