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

  /**
   * TYPSNITTEN. Deklarationen fanns här men laddade ingenting: Astro
   * emitterar @font-face först när <Font> renderas i <head>, och den
   * komponenten saknades. Verifierat i dist före rättelsen: noll träffar
   * på @font-face, noll <link rel=preload>. Sidan renderades i Georgia
   * och Segoe UI.
   *
   * cssVariable heter numera efter FAMILJEN och inte efter rollen.
   * Skälet är att rollnamnen --font-display och --font-sans ägs av
   * @theme i global.css, där de genererar utilityklasserna font-display
   * och font-sans. Låter man Astro skriva samma variabelnamn får man två
   * :root-deklarationer av samma variabel, och vilken som vinner avgörs
   * av var i <head> stilmallen hamnar. Nu är ägandet delat på ett sätt
   * som inte kan kollidera: Astro äger familjen, global.css äger rollen
   * och pekar på familjen.
   *
   * fallbacks står här och inte bara i CSS eftersom Astro använder dem
   * till TVÅ saker: som svans i variabelns värde, och som underlag för
   * optimizedFallbacks (på som standard) som genererar metrikjusterade
   * @font-face för Georgia respektive system-ui. Utan egen lista faller
   * standardvärdet in — ['sans-serif'] — och en serif hade fallit till
   * ett linjärt snitt.
   *
   * TVÅ SORTERS SPILL BORTSTÄDADE, båda uppmätta i utdatan:
   *
   *   weights   Karla hade 400, 500 och 600. font-medium förekommer inte
   *             en enda gång i markup, så 500 hämtades och skickades för
   *             ingenting.
   *   styles    Standardvärdet är ['normal', 'italic']. Sidan har ingen
   *             kursiv text alls, och utan den här raden preloadades
   *             font-instrument-serif-400-ITALIC och font-karla-400-
   *             ITALIC — två av fyra preloads gick till filer som ingen
   *             regel kan träffa.
   */
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Instrument Serif',
      cssVariable: '--font-instrument-serif',
      weights: [400],
      styles: ['normal'],
      fallbacks: ['Georgia', 'Times New Roman', 'serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Karla',
      cssVariable: '--font-karla',
      weights: [400, 600],
      styles: ['normal'],
      fallbacks: ['system-ui', '-apple-system', 'sans-serif'],
    },
  ],
});