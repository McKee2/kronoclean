/**
 * Kronoclean — single source of truth.
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
  name: 'Kronoclean',
  tagline: 'Rent · Fräscht · Pålitligt',

  /** TODO: bekräfta vilket nummer som ska ligga live */
  phone: '070-000 00 00',
  phoneHref: 'tel:+46700000000',

  /**
   * TODO: förnamnet på den i familjen som står som ägare och är den
   * kunden pratar med. Renderas i hero, i meningen "Jag heter NN och
   * driver Kronoclean tillsammans med min familj" — alltså som
   * KONTAKTPERSON, inte som den enda som städar. Fyll aldrig i ett namn
   * här som en formulering längre ned gör till ensam utförare igen.
   */
  ownerFirstName: 'NN',

  /** TODO: org.nr till sidfot och juridiska sidor */
  orgNr: '000000-0000',

  city: 'Växjö',

  /** TODO: bekräfta orterna. De ska få stryka det de inte kör till. */
  areas: ['Växjö', 'Alvesta', 'Rottne', 'Lammhult'],

  /**
   * Sanningsspärrar. Ett påstående renderas bara om det är sant.
   * hasInsurance sätts till true först när försäkringen är tecknad.
   */
  hasFTax: true,
  hasInsurance: false,

  /** RUT 2026: 50 % av arbetskostnaden, tak 75 000 kr/person/år */
  rutPercent: 50,

  /** TODO: svarstid — bara om de faktiskt kan hålla den */
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

  /** De städar hemma hos kund. Ingen publik besöksadress finns i dag. */
  addressConfirmed: false,

  /** true först när /public/og-kronoclean.jpg (1200x630) faktiskt finns. */
  ogImageConfirmed: false,

  /**
   * kronoclean.se är registrerad och företagets egen. Vänd 2026-09-01.
   *
   * Detta är den enda flaggan i listan som gatar en EXTERN referens:
   * canonical, og:url, sitemapens loc och JSON-LD:ns @id pekar alla dit.
   * Går domänen någonsin förlorad ska den vändas tillbaka till false
   * innan nästa bygge — sajten skulle annars peka på den som tar över.
   */
  domainConfirmed: true,
} as const;

/**
 * Flaggor som gatar RENDERAT innehåll eller EXTERNA referenser. Är någon
 * av dem false får sajten inte byggas för produktion — se
 * assertRedoForProduktion().
 *
 * Medvetet UTANFÖR listan, och varför:
 *   addressConfirmed  De städar hemma hos kund. false är det permanent
 *                     rätta svaret, inte ett ofärdigt tillstånd.
 *   ogImageConfirmed  Har en sann fallback (loggan). Inget osant renderas.
 *   orgNrConfirmed    Renderas ingenstans än, och ska aldrig in i JSON-LD.
 *   areasConfirmed    Utelämnas tyst ur grafen. Ingen besökare ser skillnad.
 */
const LANSERINGSSPARRAR: ReadonlyArray<readonly [string, boolean, string]> = [
  ['phoneConfirmed', COMPANY.phoneConfirmed, 'telefonnumret — sidans enda konvertering'],
  ['ownerNameConfirmed', COMPANY.ownerNameConfirmed, 'kontaktpersonens förnamn — renderas i hero'],
  ['responsePromiseConfirmed', COMPANY.responsePromiseConfirmed, 'svarstidslöftet — ett löfte de måste kunna hålla'],
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

/**
 * Läser en miljövariabel vid byggtid.
 *
 * MÅSTE gå via process.env, inte import.meta.env. Vite ersätter
 * `import.meta.env.X` STATISKT när modulen transformeras, och bundlern
 * viker sedan ihop resultatet. Den första versionen av byggkontext()
 * kompilerades bokstavligen till:
 *
 *     var byggkontext = () => { return "cf-produktion"; };
 *
 * — noll `import.meta.env` kvar i chunken. Värdet frystes alltså när
 * modulen transformerades, inte när bygget kördes, vilket gjorde
 * Cloudflare-detekteringen omöjlig att träffa och gav (lokal-produktion)
 * i en skarp CF-körning.
 *
 * process.env rörs inte av Vite och läses i den Node-process som kör
 * prerender-steget — den process som faktiskt ärver Cloudflares miljö.
 * globalThis-omvägen finns för att slippa @types/node som beroende.
 */
const env = (namn: string): string | undefined => {
  const p = (
    globalThis as {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process;
  const varde = p?.env?.[namn];
  return varde === undefined || varde === '' ? undefined : varde;
};

/** Alla synliga CF_*- och CI-nycklar. Ren diagnostik för byggloggen. */
const synligaPlattformsnycklar = (): string[] => {
  const p = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process;
  if (!p?.env) return [];
  return Object.keys(p.env)
    .filter((k) => k === 'CI' || k.startsWith('CF_'))
    .sort();
};

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
  // import.meta.env.PROD är avsiktligt kvar: den SKA vara kompiletidsvärde,
  // eftersom den skiljer `astro dev` från `astro build`. Allt som beror på
  // körmiljön går via env() ovan.
  if (!import.meta.env.PROD) return 'dev';

  // CF_PAGES räcker inte ensamt som CF-signal — om Cloudflare av någon
  // anledning inte sätter den ska CF_PAGES_BRANCH eller CF_PAGES_COMMIT_SHA
  // ändå avslöja plattformen. Fler signaler, inte färre.
  const gren = env('CF_PAGES_BRANCH');
  const paCloudflare = Boolean(
    env('CF_PAGES') ?? gren ?? env('CF_PAGES_COMMIT_SHA'),
  );

  if (!paCloudflare) {
    return env('TILLAT_PLATSHALLARE') ? 'lokal-staging' : 'lokal-produktion';
  }

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
 * Skriver byggkontexten till loggen.
 *
 * Ligger FÖRST i assertRedoForProduktion, före varje kastväg. Första
 * versionen loggade i index.astro EFTER anropet till spärren, vilket
 * betydde att raden aldrig syntes vid en vägran — alltså precis i det
 * läge man behöver den. Diagnosen fick i stället göras på parentesen i
 * felmeddelandet.
 *
 * Den tredje raden är den avgörande: den listar vilka CF_*- och
 * CI-nycklar som faktiskt är synliga. Säger den "(inga)" sätter
 * Cloudflare dem inte för byggsteget, och då är grennamnet inte en
 * framkomlig signal.
 */
const loggaByggkontext = (kontext: Byggkontext): void => {
  if (!import.meta.env.PROD) return;

  const nycklar = synligaPlattformsnycklar();
  const visa = (namn: string) => env(namn) ?? '(saknas)';

  console.log(
    `[kronoclean] byggkontext=${kontext}` +
      ` platshållare=${harObekraftadeUppgifter() ? 'ja' : 'nej'}` +
      ` noindex=${skaNoindexas() ? 'ja' : 'nej'}`,
  );
  console.log(
    `[kronoclean] process.env: CF_PAGES=${visa('CF_PAGES')}` +
      ` CF_PAGES_BRANCH=${visa('CF_PAGES_BRANCH')}` +
      ` CF_PAGES_COMMIT_SHA=${env('CF_PAGES_COMMIT_SHA') ? 'satt' : '(saknas)'}` +
      ` CI=${visa('CI')}`,
  );
  console.log(
    `[kronoclean] synliga CF_*/CI-nycklar: ` +
      `${nycklar.length ? nycklar.join(', ') : '(inga)'}`,
  );
};

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

  // Alltid först, före varje kastväg. Se loggaByggkontext ovan.
  loggaByggkontext(kontext);

  /*
   * Kvarlämningsdetektor. TILLAT_PLATSHALLARE beviljar ingenting på
   * Cloudflare — undantaget kommer från grennamnet. Hittas variabeln ändå
   * i ett produktionsbygge har den nästan säkert hamnat i fel scope.
   * Säg det rakt ut i stället för att tiga: Pass 3-commiten dokumenterar
   * variabeln, så den som läser git-historiken är precis den som kan
   * råka sätta den.
   */
  if (kontext === 'cf-produktion' && env('TILLAT_PLATSHALLARE')) {
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

/**
 * Byggs av hasFTax/hasInsurance så inget osant kan hamna på sidan.
 *
 * `segment` är OBLIGATORISKT och har medvetet inget standardvärde. RUT
 * lades tidigare på ovillkorligt, vilket var sant så länge sidan bara
 * sålde hemstädning. Med kontors- och hotellstädning på samma sida är
 * "50 % RUT-avdrag" bredvid en företagstjänst helt enkelt fel — RUT
 * följer köparen, och ett företag är inte en fysisk person med skatt att
 * dra av. Ett defaultvärde hade gjort felet tyst; ett obligatoriskt
 * argument tvingar varje anropsplats att svara på vem markörerna gäller.
 *
 * F-skatt och försäkring gäller båda segmenten och är därför ogatade.
 */
export const trustMarkers = (segment: SegmentId): string[] => {
  const markers: string[] = [];
  if (COMPANY.hasFTax) markers.push('F-skatt');
  if (COMPANY.hasInsurance) markers.push('Ansvarsförsäkrad');
  if (SEGMENT[segment].rut) markers.push(`${COMPANY.rutPercent} % RUT-avdrag`);
  return markers;
};

/**
 * Prislogiken i en rad, för segmentrubriken i tjänstesektionen. Härledd
 * ur SEGMENT.rut av samma skäl som trustMarkers: står den som fri text i
 * markup kan den bli kvar när flaggan ändras.
 */
export const segmentVillkor = (segment: SegmentId): string =>
  SEGMENT[segment].rut
    ? `${COMPANY.rutPercent} % RUT-avdrag på arbetskostnaden`
    : 'Faktureras företag. RUT gäller bara privatpersoner.';

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
/* TJÄNSTER                                                           */
/* ------------------------------------------------------------------ */

/**
 * Sajten är en one-pager i dag. Tjänsterna ligger ändå som data, inte som
 * text i markup, av ett enda skäl: var och en ska kunna bli
 * /tjanster/<slug> utan att något byggs om. Ett <li> i en sektion går
 * inte att rendera en egen sida ur.
 *
 * `slug` är därför inte en formatering av namnet utan tjänstens identitet.
 * Den blir en URL, och en URL som ändras efter lansering kostar
 * placeringar. Bestäm den här, en gång, medan den ännu är gratis.
 * Slugarna är ASCII: ä och ö i en URL blir procentkodade och oläsbara
 * när de klistras in.
 */

/**
 * De två affärerna. Skilda kundtyper, skild prislogik, samma sida.
 *
 * RUT sitter på SEGMENTET, inte på tjänsten. Det är inte en förenkling
 * utan hur avdraget faktiskt fungerar: det följer KÖPAREN — en fysisk
 * person med skatt att dra av — inte vilken sorts städning som utförs.
 * Ett företag får inget RUT för hemstädning heller. Modelleras rut som
 * ett fält per tjänst inbjuder strukturen till att någon sätter
 * `rut: true` på kontorsstädning den dag ett aktiebolag frågar.
 */
export const SEGMENT = {
  privat: {
    id: 'privat',
    /** Rubrik när de två affärerna ska skiljas åt visuellt. */
    label: 'För dig hemma',
    audience: 'Privatperson',
    rut: true,
  },
  foretag: {
    id: 'foretag',
    label: 'För företag',
    audience: 'Företag',
    rut: false,
  },
} as const;

export type SegmentId = keyof typeof SEGMENT;

/**
 * Ordningen är avsiktlig och är den ordning de ska renderas i: de tre
 * privata först, företagstjänsterna sist. Sortera aldrig listan i en
 * komponent — då flyttar prioriteringen ut ur datafilen.
 */
export const SERVICES = [
  {
    slug: 'hemstadning',
    name: 'Hemstädning',
    segment: 'privat',
    blurb: 'Regelbunden städning av hela hemmet — kök, badrum, golv och ytor.',
  },
  {
    slug: 'flyttstadning',
    name: 'Flyttstädning',
    segment: 'privat',
    blurb: 'Hela bostaden städad till besiktningsstandard när du flyttar ut.',
  },
  {
    slug: 'dodsbostadning',
    name: 'Dödsbostädning',
    segment: 'privat',
    /**
     * Egen ton, inte bara eget innehåll. Den som söker dödsbostädning har
     * nyligen förlorat någon. Språket från hemstäd — fräscht, effektivt,
     * boka enkelt — landar fel och läser som okänsligt. Flaggan finns här
     * så att en framtida sektion eller sida kan välja rätt register i
     * stället för att ärva standardtonen av misstag.
     */
    varsamTon: true,
    /**
     * blurb saknas AVSIKTLIGT. Kortet renderar namn och ikon utan
     * beskrivning tills texten är skriven för hand i rätt register.
     * Skriv aldrig en platshållarrad här "så länge" — en mening i fel
     * ton på just den här tjänsten kostar mer än ingen mening alls.
     */
  },
  {
    slug: 'kontorsstadning',
    name: 'Kontorsstädning',
    segment: 'foretag',
    blurb: 'Kontor, mötesrum och personalutrymmen på fasta tider.',
  },
  {
    slug: 'hotellstadning',
    name: 'Hotellstädning',
    segment: 'foretag',
    blurb: 'Rumsstädning, linnebyte och gemensamma ytor.',
  },
] as const;

export type Service = (typeof SERVICES)[number];

/** Gäller RUT för den här tjänsten? Härlett ur segmentet, aldrig satt. */
export const hasRut = (service: Service): boolean =>
  SEGMENT[service.segment].rut;

/** Tjänsterna i ett segment, i datafilens ordning. */
export const servicesIn = (segment: SegmentId): Service[] =>
  SERVICES.filter((s) => s.segment === segment);

/**
 * Framtida sidas URL. Ligger här och inte i en komponent så att slugen
 * har en enda källa den dag /tjanster/[slug].astro faktiskt finns.
 */
export const servicePath = (service: Service): string =>
  `/tjanster/${service.slug}`;

/* ------------------------------------------------------------------ */
/* SEO                                                                */
/* ------------------------------------------------------------------ */

export const SEO = {
  title: 'Hemstädning i Växjö — Kronoclean',
  /**
   * Ledde tidigare med "Samma person varje gång" — samma osanning som
   * stod i heron. Ersatt av det som faktiskt skiljer ett familjeföretag
   * från en ensam städare, och som dessutom är det enda argumentet en
   * kund inte kan få av en soloföretagare.
   *
   * 124 tecken. Google klipper runt 155 på desktop och kortare på mobil,
   * så meningen som bär argumentet ligger före "Ring för bokning".
   */
  description:
    'Hemstädning i Växjö med RUT-avdrag. Familjeföretag med flera städare — blir någon sjuk kommer någon annan. Ring för bokning.',
  locale: 'sv_SE',
  /** Matchar --color-mist i global.css så webbläsarfältet smälter in. */
  themeColor: '#EEF4F9',
  logoPath: '/kronoclean-logo.webp',
  ogImagePath: '/og-kronoclean.jpg',
  ogImageAlt: 'Kronoclean — hemstädning i Växjö',
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
 * beskrivs som verksamhetens fysiska plats. Kronoclean har ingen — de
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
   * En Service-nod per tjänst, genererad ur SERVICES. Namnet stod
   * tidigare hårdkodat som 'Hemstädning' i en enda nod — grafen påstod
   * alltså att företaget gör en sak när det gör fem.
   *
   * Noden finns fortfarande bara för areaServed — det är där ett
   * leveransområde semantiskt hör hemma. Utan bekräftade orter har
   * noderna inget innehåll och utelämnas helt.
   *
   * @id använder tjänstens slug, samma sträng som servicePath(). Den
   * dagen /tjanster/<slug> finns pekar fragmentet redan rätt och kan
   * bytas mot en absolut URL utan att identiteten ändras.
   *
   * areaServed förekommer noll gånger i Googles stödda mängd för både
   * LocalBusiness och Organization. Det är ren schema.org-semantik med
   * värde för entitetsförståelse — sälj det aldrig som lokal synlighet.
   * Det reglaget är serviceområdet i Google Företagsprofil.
   */
  if (areas.length > 0) {
    const areaServed = areas.map((area) => ({
      '@type': 'City',
      name: area,
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: 'Kronobergs län',
      },
    }));

    for (const service of SERVICES) {
      graph.push({
        '@type': 'Service',
        '@id': `${base}#${service.slug}`,
        name: service.name,
        serviceType: service.name,
        provider: { '@id': orgId },
        areaServed,
      });
    }
  }

  return { '@context': 'https://schema.org', '@graph': graph };
};
