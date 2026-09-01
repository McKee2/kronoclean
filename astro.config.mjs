// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  /**
   * Domänen är registrerad och företagets egen. Spärren ligger kvar på
   * COMPANY.domainConfirmed i src/data/company.ts — den är vänd, men
   * kopplingen består: canonical, og:url, sitemapens loc och JSON-LD:ns
   * @id pekar alla hit, så byts domänen ut måste flaggan följa med.
   */
  site: 'https://kronoclean.se',

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