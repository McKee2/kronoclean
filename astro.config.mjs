// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://nordclean.se',

  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },

  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Instrument Serif',
      cssVariable: '--font-display',
      weights: [400],
    },
    {
      provider: fontProviders.google(),
      name: 'Karla',
      cssVariable: '--font-sans',
      weights: [400, 500, 600],
    },
  ],
});