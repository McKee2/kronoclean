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
   *   weights   Sansen deklarerades först med 400, 500 och 600.
   *             font-medium förekommer inte en enda gång i markup, så 500
   *             hämtades och skickades för ingenting. Gäller Fira Sans
   *             lika mycket som det gällde Karla före bytet.
   *   styles    Standardvärdet är ['normal', 'italic']. Sidan har ingen
   *             kursiv text alls, och utan den här raden preloadades
   *             både serifens och sansens ITALIC — två av fyra preloads
   *             gick till filer som ingen regel kan träffa.
   */
  fonts: [
    /**
     * ==================================================================
     * RUBRIKERNA: ARCHIVO 800. INSTRUMENT SERIF STOD HÄR.
     * ==================================================================
     * Bytet är inte en smakändring utan en genreändring, och skälet står
     * i loggan. Ordmärket mättes pixelvis ur kronoclean-logo.webp med
     * komponentmärkning (taket överlappar ordmärkets band och filtrerades
     * bort):
     *
     *   lutning 11.25°   strokekontrast 1.53   x/versal 0.750
     *
     * Det är alltså en FET, LUTANDE GROTESK — inte ett geometriskt
     * ordmärke, vilket var antagandet innan det mättes. En rubrikserif
     * med hög strokekontrast ställd bredvid den läser inte som kontrast
     * utan som förväxling.
     *
     * VARFÖR INTE DM SERIF DISPLAY, som var det första förslaget. Mätt
     * med canvas TextMetrics på de laddade filerna, stam ÷ tunndel på ett
     * renderat O vid 200 px:
     *
     *                        strokekontrast   stam em   tunndel @ 20 px
     *   Ordmärket                  1.53          —            —
     *   Archivo 800                1.32        0.185       2.80 px
     *   Zilla Slab 700             1.21        0.145       2.40 px
     *   Source Serif 4 700         2.85        0.185       1.30 px
     *   Instrument Serif 400       3.20        0.080       0.50 px
     *   DM Serif Display 400       8.00        0.160       0.40 px
     *
     * DM Serif ligger en faktor 5.2 från ordmärket. Men det avgörande
     * var inte heron utan KORTEN: --font-display bär även rubrikerna på
     * 20 px i Tjänster och Så går det till, och där blir DM Serifs
     * tunndel 0.40 px. Under en hel pixel. Snittet har dessutom bara vikt
     * 400 och kan inte kompenseras.
     *
     * Samma mätning avslöjade att Instrument Serif låg på 0.50 px i samma
     * läge. Kortrubrikerna var alltså redan sköra; bytet lagar dem.
     *
     * VARFÖR ARCHIVO OCH INTE EN KONDENSERAD. Archivo skiljer sig från
     * ordmärket på de två axlar som går att skilja på: UPPRÄTT mot 11.25°
     * lutning, BRED mot kondenserad. Oswald och Anton ekar i stället
     * märkets proportioner. Anton föll dessutom på svenskan — dess Å
     * mäter 1.225 em och går utanför em-rutan.
     *
     * EN ENDA VIKT, 800, och det är avsiktligt. Rollen ÄR Archivo 800;
     * se .font-display i global.css där vikten bor. Laddas fler vikter
     * blir varje siffra i markup ett val som ingen har räknat på.
     *
     * fallbacks är numera SANS. De stod på Georgia/Times, vilket var rätt
     * för en serif och skulle ha renderat fel snittklass här — och de
     * matar dessutom optimizedFallbacks, som genererar metrikjusterade
     * @font-face ur dem.
     */
    {
      provider: fontProviders.google(),
      name: 'Archivo',
      cssVariable: '--font-archivo',
      weights: [800],
      styles: ['normal'],
      fallbacks: ['Helvetica Neue', 'Arial', 'sans-serif'],
    },
    /**
     * ==================================================================
     * BRÖDTEXTEN: FIRA SANS. KARLA STOD HÄR.
     * ==================================================================
     * Karla är en GROTESK, inte en humanist, och det var skälet att byta.
     * Mätt i den renderade filen (canvas TextMetrics, 100 px):
     *
     *                    x/em   versal/em   x/versal   å     ä    provbredd
     *   Karla            0.480    0.630       0.762   0.74  0.67    624.8
     *   Source Sans 3    0.490    0.660       0.742   0.75  0.69    569.3
     *   Fira Sans        0.530    0.690       0.768   0.84  0.77    615.8
     *   Noto Sans        0.540    0.720       0.750   0.82  0.73    649.3
     *   Instrument Serif 0.510    0.720       0.708   0.99  0.92      —
     *
     * (provbredd = samma svenska mening på 76 tecken satt i 16 px)
     *
     * VARFÖR FIRA OCH INTE DE ANDRA TVÅ:
     *
     *   Source Sans 3 föll på kravet. x-höjden är 0.490 — två procent
     *   över Karlas 0.480. Kravet var TYDLIG x-höjd, och ett snitt som
     *   ligger inom brus från det man byter ifrån löser ingenting. Den
     *   är dessutom 9 % smalare, vilket ändrar radbrytningen: stegen
     *   blir 2/2/2/5 rader i stället för 2/3/2/6 och ol:en 734 px i
     *   stället för 786.
     *
     *   Noto Sans är metriskt godkänd (0.540) men har versalhöjd 0.720
     *   — exakt Instrument Serifs. Två snitt med samma vertikala
     *   proportioner slutar dela upp arbetet mellan sig, och serifen
     *   tappar sin auktoritet. Den är också 3,9 % bredare än Karla och
     *   den mest systemtypsnittslika av de tre.
     *
     *   Fira Sans ger +10,4 % x-höjd mot Karla (8.48 px mot 7.68 vid
     *   16 px), håller versalhöjden 0.690 UNDER serifens 0.720, och är
     *   1,4 % smalare — så nära att ingen geometri på sidan rör sig.
     *   Verifierat renderat vid 390, Karla mot Fira: dokumenthöjd
     *   3738 = 3738, sektionshöjder [750, 1187, 1078, 312] identiska,
     *   kortens höjder [142, 142, 78, 142, 142] identiska, stegens
     *   [140, 166, 140, 244] identiska, radANTALET oförändrat överallt.
     *   Det enda som rör sig är VAR en rad bryter: hero-stycket delar
     *   sista raden efter "ensam" i stället för före. Passet byter
     *   alltså textur, inte layout, och ingenting som mättes i tidigare
     *   pass behöver räknas om.
     *
     *   Diakriterna avgjorde tvekan. På den här sidan bär var tredje ord
     *   en prick eller en ring — städning, Växjö, förut, går, kök,
     *   överens, efteråt. Firas å ligger 0.31 em över x-höjden och ä
     *   0.24; Karlas 0.26 respektive 0.19. Det är inte dekor, det är
     *   skillnaden mellan a och å vid 16 px.
     *
     * weights: 400 och 600. 600 används av hero-taglinen, sidfotens
     * etiketter, siffrorna i "Så går det till" och numret i sidhuvudet.
     * Ett snitt utan 600 hade tvingat den vikten till 700 — det var
     * skälet att PT Sans aldrig blev kandidat.
     */
    {
      provider: fontProviders.google(),
      name: 'Fira Sans',
      cssVariable: '--font-fira-sans',
      weights: [400, 600],
      styles: ['normal'],
      fallbacks: ['system-ui', '-apple-system', 'sans-serif'],
    },
  ],
});