/**
 * Nordclean — single source of truth.
 *
 * Allt som kan ändras eller som ännu inte är bekräftat bor här.
 * Hårdkoda aldrig telefonnummer, orter eller priser i komponenterna.
 *
 * TODO-markerade fält måste bekräftas av kunden före lansering.
 *
 * SANNINGSPRINCIPEN
 * Ett fält utelämnas hellre än fylls med platshållare. Spärren är alltid
 * en explicit boolean, aldrig strängsniffning efter '000' eller 'NN':
 *
 *   1. Sniffning ger falska positiva. 0470-100 000 är ett riktigt nummer
 *      som matchar '000'.
 *   2. Sniffning ger falska negativa, och det är den farliga riktningen.
 *      Byts platshållaren till 070-123 45 67 glider den rakt igenom.
 *   3. En flagga är en mänsklig handling. Den syns i en diff och granskas
 *      som ett beslut. En strängändring ser ut som formatering.
 *   4. Flaggan är frikopplad från formatering. Skrivs numret om ändras
 *      inte spärrens beteende.
 *   5. Inuti `as const` smalnar flaggan till literalen true/false, så
 *      TypeScript ser vilken gren som är levande.
 */

export const COMPANY = {
  name: 'Nordclean',
  tagline: 'Rent · Fräscht · Pålitligt',

  /** TODO: bekräfta vilket nummer som ska ligga live */
  phone: '070-000 00 00',
  phoneHref: 'tel:+46700000000',

  /** TODO: hennes förnamn — används i hero och om-sektionen */
  ownerFirstName: 'NN',

  /** TODO: org.nr till sidfot och juridiska sidor */
  orgNr: '000000-0000',

  city: 'Växjö',

  /** TODO: bekräfta orterna. Hon ska få stryka det hon inte kör till. */
  areas: ['Växjö', 'Alvesta', 'Rottne', 'Lammhult'],

  /**
   * Sanningsspärrar. Ett påstående renderas bara om det är sant.
   * hasInsurance sätts till true först när försäkringen är tecknad.
   */
  hasFTax: true,
  hasInsurance: false,

  /** RUT 2026: 50 % av arbetskostnaden, tak 75 000 kr/person/år */
  rutPercent: 50,

  /** TODO: svarstid — bara om hon faktiskt kan hålla den */
  responsePromise: 'Svarar oftast samma dag',

  /**
   * Bekräftelseflaggor. Vänds bara av en människa som verifierat
   * uppgiften med kunden. Se SANNINGSPRINCIPEN överst.
   *
   * Så länge en flagga är false utelämnas fältet ur strukturerad data,
   * meta och sidan — det fylls aldrig med platshållaren.
   */
  phoneConfirmed: false,
  ownerNameConfirmed: false,
  orgNrConfirmed: false,
  areasConfirmed: false,
  responsePromiseConfirmed: false,

  /** Hon städar hemma hos kund. Ingen publik besöksadress finns i dag. */
  addressConfirmed: false,

  /** true först när /public/og-nordclean.jpg (1200x630) faktiskt finns. */
  ogImageConfirmed: false,

  /**
   * TODO: true först när nordclean.se faktiskt är registrerad och hennes.
   * Detta är värre än en platshållartelefon — det är en EXTERN referens.
   * canonical, og:url, sitemapens loc och JSON-LD:ns @id pekar alla dit.
   * Registrerar någon annan domänen pekar sajten aktivt på dem.
   */
  domainConfirmed: false,
} as const;

/**
 * Flaggor som gatar RENDERAT innehåll eller EXTERNA referenser. Är någon
 * av dem false får sajten inte byggas för produktion — se
 * assertRedoForProduktion().
 *
 * Medvetet UTANFÖR listan, och varför:
 *   addressConfirmed  Hon städar hemma hos kund. false är det permanent
 *                     rätta svaret, inte ett ofärdigt tillstånd.
 *   ogImageConfirmed  Har en sann fallback (loggan). Inget osant renderas.
 *   orgNrConfirmed    Renderas ingenstans än, och ska aldrig in i JSON-LD.
 *   areasConfirmed    Utelämnas tyst ur grafen. Ingen besökare ser skillnad.
 */
const LANSERINGSSPARRAR: ReadonlyArray<readonly [string, boolean, string]> = [
  ['phoneConfirmed', COMPANY.phoneConfirmed, 'telefonnumret — sidans enda konvertering'],
  ['ownerNameConfirmed', COMPANY.ownerNameConfirmed, 'ägarens förnamn — renderas i hero och fotokortet'],
  ['responsePromiseConfirmed', COMPANY.responsePromiseConfirmed, 'svarstidslöftet — ett löfte hon måste kunna hålla'],
  ['domainConfirmed', COMPANY.domainConfirmed, 'domänen — canonical, og:url, sitemap och JSON-LD pekar dit'],
];

/**
 * Grenen som Cloudflare Pages behandlar som produktion.
 *
 * Hårdkodad här, aldrig läst ur en miljövariabel. Läste vi den ur env
 * skulle en felsatt variabel kunna flytta vad "produktion" betyder, och
 * hela spärren vore beroende av en inställning igen.
 */
const PRODUKTIONSGREN = 'main';

type Byggkontext =
  | 'dev'
  | 'lokal-staging'
  | 'lokal-produktion'
  | 'cf-preview'
  | 'cf-produktion'
  | 'cf-okand-gren';

/**
 * Vilket slags bygge är detta?
 *
 * Undantaget för platshållare härleds ur GRENEN, inte ur en miljövariabel.
 * Det betyder att ingenting behöver sättas i Cloudflare för att en preview
 * ska fungera — och att det inte finns någon inställning som kan bli kvar
 * och tyst göra produktionsspärren verkningslös.
 *
 * Mätt, inte gissat: import.meta.env.PROD är true även på en preview-gren
 * (PROD skiljer på `astro dev` och `astro build`, inte på preview och
 * produktion), så PROD ensamt kan inte avgöra frågan. CF_PAGES,
 * CF_PAGES_BRANCH, CF_PAGES_URL och CI når koden vid byggtid som strängar.
 *
 * Okänd gren på Cloudflare är fail-closed: vet vi inte var vi är, bygger
 * vi inte med platshållare.
 */
export const byggkontext = (): Byggkontext => {
  if (!import.meta.env.PROD) return 'dev';

  if (!import.meta.env.CF_PAGES) {
    return import.meta.env.TILLAT_PLATSHALLARE
      ? 'lokal-staging'
      : 'lokal-produktion';
  }

  const gren = import.meta.env.CF_PAGES_BRANCH;
  if (!gren) return 'cf-okand-gren';

  return gren === PRODUKTIONSGREN ? 'cf-produktion' : 'cf-preview';
};

/** Kontexter där ett obekräftat fält får renderas. */
const TILLATER_PLATSHALLARE = new Set<Byggkontext>([
  'dev',
  'lokal-staging',
  'cf-preview',
]);

/** Finns det någon obekräftad uppgift som skulle kunna synas? */
export const harObekraftadeUppgifter = (): boolean =>
  LANSERINGSSPARRAR.some(([, bekraftad]) => !bekraftad);

/**
 * noindex så länge platshållare kan förekomma.
 *
 * Detta är backstoppet som INTE beror på miljövariabler och därför
 * överlever varje felkonfiguration: skulle ett platshållarbygge mot
 * förmodan publiceras kan det ändå inte indexeras. Cloudflares
 * preview-deployer är publika som standard.
 *
 * Försvinner av sig själv den dag alla flaggor är vända.
 */
export const skaNoindexas = (): boolean => harObekraftadeUppgifter();

/**
 * Vägrar bygga för produktion så länge något obekräftat fält skulle nå
 * publik. Samma princip som flaggorna, ett steg upp: en flagga är en
 * mänsklig handling, och ett bygge som vägrar är den handlingen på
 * systemnivå.
 *
 * Ärlig begränsning: Cloudflare injicerar CF_PAGES_BRANCH men deras docs
 * säger uttryckligen "can be overridden". Någon med dashboard-åtkomst kan
 * alltså överskriva den i production-scopet och lura grenkontrollen. Ingen
 * env-baserad spärr är manipulationssäker mot dashboard-åtkomst. Syftet
 * här är att eliminera OLYCKOR och göra ett kringgående till en medveten,
 * i sig misstänkt handling. Det env-oberoende skyddet är skaNoindexas().
 */
export const assertRedoForProduktion = (): void => {
  const kontext = byggkontext();

  /*
   * Kvarlämningsdetektor. TILLAT_PLATSHALLARE beviljar ingenting på
   * Cloudflare — undantaget kommer från grennamnet. Hittas variabeln ändå
   * i ett produktionsbygge har den nästan säkert hamnat i fel scope.
   * Säg det rakt ut i stället för att tiga: Pass 3-commiten dokumenterar
   * variabeln, så den som läser git-historiken är precis den som kan
   * råka sätta den.
   */
  if (kontext === 'cf-produktion' && import.meta.env.TILLAT_PLATSHALLARE) {
    throw new Error(
      'TILLAT_PLATSHALLARE är satt i ett produktionsbygge ' +
        `(CF_PAGES_BRANCH=${PRODUKTIONSGREN}).\n\n` +
        'Den beviljar ingenting här och hör inte hemma i production-scopet.\n' +
        'Ta bort den: Cloudflare > Settings > Variables and Secrets > Production.\n' +
        'Preview-bygget behöver den inte — undantaget härleds ur grennamnet.\n',
    );
  }

  if (TILLATER_PLATSHALLARE.has(kontext)) return;

  const kvar = LANSERINGSSPARRAR.filter(([, bekraftad]) => !bekraftad);
  if (kvar.length === 0) return;

  const rader = kvar
    .map(([flagga, , varfor]) => `  - ${flagga}: ${varfor}`)
    .join('\n');

  const utvag =
    kontext === 'cf-produktion'
      ? `För en delbar förhandsvisning: pusha en gren som inte heter ${PRODUKTIONSGREN}.\n` +
        'Cloudflare bygger den som preview automatiskt — ingen variabel behövs.\n'
      : kontext === 'cf-okand-gren'
        ? 'CF_PAGES är satt men CF_PAGES_BRANCH saknas, så bygget kan inte\n' +
          'avgöra om detta är produktion. Spärren är fail-closed och vägrar.\n'
        : 'För ett medvetet lokalt stagingbygge: TILLAT_PLATSHALLARE=1 npm run build\n';

  throw new Error(
    `Produktionsbygge stoppat (${kontext}): ${kvar.length} obekräftad(e) ` +
      `uppgift(er) skulle nå publik.\n\n${rader}\n\n` +
      'Bekräfta uppgiften med kunden och vänd flaggan i src/data/company.ts.\n' +
      utvag,
  );
};

/** Byggs av hasFTax/hasInsurance så inget osant kan hamna på sidan. */
export const trustMarkers = (): string[] => {
  const markers: string[] = [];
  if (COMPANY.hasFTax) markers.push('F-skatt');
  if (COMPANY.hasInsurance) markers.push('Ansvarsförsäkrad');
  markers.push(`${COMPANY.rutPercent} % RUT-avdrag`);
  return markers;
};

/**
 * Spärrade läsare. Returtypen är explicit `string | null` — utan den
 * skulle TypeScript smalna till `null` (flaggan är literalen false inuti
 * `as const`) och konsumenten skulle tappa string-grenen.
 */
export const phoneDisplay = (): string | null =>
  COMPANY.phoneConfirmed ? COMPANY.phone : null;

export const phoneHref = (): string | null =>
  COMPANY.phoneConfirmed ? COMPANY.phoneHref : null;

export const ownerFirstName = (): string | null =>
  COMPANY.ownerNameConfirmed ? COMPANY.ownerFirstName : null;

export const responsePromise = (): string | null =>
  COMPANY.responsePromiseConfirmed ? COMPANY.responsePromise : null;

export const orgNr = (): string | null =>
  COMPANY.orgNrConfirmed ? COMPANY.orgNr : null;

export const serviceAreas = (): string[] =>
  COMPANY.areasConfirmed ? [...COMPANY.areas] : [];

/* ------------------------------------------------------------------ */
/* SEO                                                                */
/* ------------------------------------------------------------------ */

export const SEO = {
  title: 'Hemstädning i Växjö — Nordclean',
  description:
    'Hemstädning i Växjö med RUT-avdrag. Samma person varje gång. Ring för bokning.',
  locale: 'sv_SE',
  /** Matchar --color-mist i global.css så webbläsarfältet smälter in. */
  themeColor: '#EEF4F9',
  logoPath: '/nordclean-logo.webp',
  ogImagePath: '/og-nordclean.jpg',
  ogImageAlt: 'Nordclean — hemstädning i Växjö',
} as const;

/**
 * Absolut URL ur Astro.site. Astro typar Astro.site som `URL | undefined`,
 * så vi smäller av vid bygget i stället för att tyst producera en relativ
 * canonical som ser rätt ut men inte är det.
 */
export const absoluteUrl = (site: URL | undefined, path: string): string => {
  if (!site) {
    throw new Error(
      'astro.config.mjs saknar `site` — kan inte bygga absoluta URL:er.',
    );
  }
  return new URL(path, site).href;
};

/** Faller tillbaka på loggan tills en riktig 1200x630-bild finns. */
export const ogImageUrl = (site: URL | undefined): string =>
  absoluteUrl(site, COMPANY.ogImageConfirmed ? SEO.ogImagePath : SEO.logoPath);

/**
 * JSON-LD-graf. Samma princip som trustMarkers(): ett fält utelämnas
 * hellre än fylls med platshållare.
 *
 * Typval: Organization, inte LocalBusiness. Googles LocalBusiness-doc har
 * en required-tabell med exakt två rader, address och name, och address
 * beskrivs som verksamhetens fysiska plats. Nordclean har ingen — hon
 * städar hemma hos kund. Utan address är LocalBusiness inte berättigad
 * till rich result ändå, så märkningen skulle bara rapportera ett saknat
 * obligatoriskt fält i Search Console. Organization har inga
 * obligatoriska fält och kan därför aldrig falera på detta.
 * https://developers.google.com/search/docs/appearance/structured-data/local-business
 * https://developers.google.com/search/docs/appearance/structured-data/organization
 *
 * Var ärlig om utfallet: detta ger INGET rich result 2026. Värdet är
 * entitets- och kunskapsgrafsvärde. Rich Results Test kommer att svara
 * "No items detected that are eligible for rich results" — det är rätt
 * svar, inte ett fel.
 *
 * Record<string, unknown> i stället för ett handskrivet interface:
 * COMPANY är `as const`, och en readonly-array kan aldrig tilldelas ett
 * string[]-typat fält. En lös indexsignatur undviker readonly-krocken
 * utan att en enda `as` behövs.
 */
type JsonLdNode = Record<string, unknown>;

export const buildStructuredData = (site: URL | undefined): JsonLdNode => {
  const base = absoluteUrl(site, '/');
  const orgId = `${base}#organisation`;
  const areas = serviceAreas();

  const organization: JsonLdNode = {
    '@type': COMPANY.addressConfirmed
      ? 'HomeAndConstructionBusiness'
      : 'Organization',
    '@id': orgId,
    name: COMPANY.name,
    url: base,
    logo: absoluteUrl(site, SEO.logoPath),
    description: SEO.description,

    ...(COMPANY.phoneConfirmed
      ? { telephone: COMPANY.phoneHref.replace(/^tel:/, '') }
      : {}),

    ...(COMPANY.ownerNameConfirmed
      ? { founder: { '@type': 'Person', givenName: COMPANY.ownerFirstName } }
      : {}),

    // sameAs: läggs till när Google Företagsprofil / Facebook finns.
    //         Högsta hävstången i hela grafen — prioritera den.
    // address: bara om en publik besöksadress någonsin uppstår.
    // orgNr:   medvetet utelämnat även när det är bekräftat. Google matar
    //          inget på taxID/vatID, och för enskild firma ÄR org.nr
    //          personnumret. Hör hemma i sidfoten, inte maskinläsbart.
    // aggregateRating/review: utelämnat — Google rekommenderar dem endast
    //          för sajter som samlar omdömen om ANDRA företag.
  };

  const graph: JsonLdNode[] = [organization];

  /**
   * Service-noden finns bara för areaServed — det är där ett
   * leveransområde semantiskt hör hemma. Utan bekräftade orter har noden
   * inget innehåll och utelämnas helt.
   *
   * areaServed förekommer noll gånger i Googles stödda mängd för både
   * LocalBusiness och Organization. Det är ren schema.org-semantik med
   * värde för entitetsförståelse — sälj det aldrig som lokal synlighet.
   * Det reglaget är serviceområdet i Google Företagsprofil.
   */
  if (areas.length > 0) {
    graph.push({
      '@type': 'Service',
      '@id': `${base}#hemstadning`,
      name: 'Hemstädning',
      serviceType: 'Hemstädning',
      provider: { '@id': orgId },
      areaServed: areas.map((area) => ({
        '@type': 'City',
        name: area,
        containedInPlace: {
          '@type': 'AdministrativeArea',
          name: 'Kronobergs län',
        },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
};
