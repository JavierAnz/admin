// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({

  output: 'server',


  vite: {
    plugins: [tailwindcss()]
  },
  image: {
    service: { entrypoint: 'astro/assets/services/noop' }
  },

  adapter: node({
    mode: 'standalone'
  }),

  integrations: [svelte()]
});