// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  /**
   * OBS: domänen är ännu inte registrerad. Den kan inte tas bort härifrån
   * — @astrojs/sitemap kräver `site`, och absoluteUrl() kastar utan den —
   * så spärren ligger i stället på COMPANY.domainConfirmed i
   * src/data/company.ts, som stoppar produktionsbygget tills domänen är
   * hennes. Detta är värre än en platshållartelefon: canonical, og:url,
   * sitemapens loc och JSON-LD:ns @id pekar alla hit, så registrerar
   * någon annan nordclean.se pekar sajten aktivt på dem.
   */
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