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

/**
 * Telefonens tre lägen. Se phoneStatus i COMPANY.
 */
export type TelefonLage = 'bekraftat' | 'platshallare' | 'dolt';

export const COMPANY = {
  name: 'Kronoclean',
  tagline: 'Rent · Fräscht · Pålitligt',

  /** TODO: bekräfta vilket nummer som ska ligga live */
  phone: '070-000 00 00',
  phoneHref: 'tel:+46700000000',

  /**
   * Vad som visas i läget 'platshallare'. Måste vara OMÖJLIG att slå.
   *
   * X:en är hela poängen. 070-000 00 00 ser ut som ett nummer och kan
   * ringas — det var faran, inte att en siffra syns. 07X-XXX XX XX kan
   * ingen ringa och ingen missta för äkta, så den kan visas utan att
   * någon riskerar att nå fel person.
   *
   * Skriv aldrig om den till något slåbart "så länge".
   */
  phonePlatshallare: '07X-XXX XX XX',

  /**
   * TODO: förnamnet på den i familjen som står som ägare och är den
   * kunden pratar med. Renderas i hero, i meningen "Jag heter NN och
   * driver Kronoclean tillsammans med min familj" — alltså som
   * KONTAKTPERSON, inte som den enda som städar. Fyll aldrig i ett namn
   * här som en formulering längre ned gör till ensam utförare igen.
   */
  ownerFirstName: 'NN',

  /**
   * TODO: mejladressen. Sekundär kontaktväg i kontaktsektionen och
   * sidfoten — för den som ogärna ringer. Telefonen är primär.
   */
  email: 'kontakt@kronoclean.se',

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
  /**
   * Telefonens tillstånd. ETT fält, tre ömsesidigt uteslutande lägen —
   * inte två booleans som kan hamna i konflikt.
   *
   *   'bekraftat'    numret är verifierat med kunden. Renderas som
   *                  klickbar tel:-länk.
   *   'platshallare' 07X-XXX XX XX som ren text. Ingen tel:-länk, ingen
   *                  aria-label som påstår att man kan ringa.
   *   'dolt'         blocket utelämnas helt.
   *
   * Varför en union och inte en andra boolean: med phoneConfirmed +
   * phoneShowPlaceholder finns fyra kombinationer men bara tre giltiga
   * tillstånd. Den fjärde — bekräftat OCH platshållare — har ingen
   * mening, och det är precis den sortens tillstånd som blir kvar efter
   * en halvfärdig ändring. Ett fält kan inte motsäga sig självt.
   *
   * Detta bryter INTE mot SANNINGSPRINCIPEN överst. Den förbjuder att
   * spärren härleds ur DATAVÄRDET genom strängsniffning. Det här är ett
   * eget tillståndsfält som en människa sätter, det syns i en diff, och
   * inuti `as const` smalnar det till en literal så TypeScript ser vilken
   * gren som är levande. Alla fem skälen håller.
   *
   * Produktionsspärren gäller oförändrat: bara 'bekraftat' släpper
   * igenom bygget. Det här ändrar hur ett VÄGRAT bygge ser ut, inte om
   * det godkänns.
   */
  phoneStatus: 'platshallare',
  ownerNameConfirmed: false,
  orgNrConfirmed: false,

  /**
   * Mejladressen. Utelämnas tyst tills den är bekräftad — telefonen är
   * primär kontaktväg, så sidan har en fungerande väg även utan den.
   */
  emailConfirmed: false,

  /**
   * true först när /integritetspolicy faktiskt finns och svarar 200.
   * Samma princip som apple-touch-icon i index.astro: en länk till en
   * sida som ger 404 är samma sorts osanning som en platshållartelefon,
   * och i sidfoten är den värre — där läser besökaren den som ett bevis
   * på att policyn finns.
   *
   * Sidan samlar i dag ingenting: inget formulär, inga kakor, ingen
   * analys. Det finns alltså ännu inget att beskriva. Flaggan vänds den
   * dag något av det tillkommer, och då är policyn inte valfri.
   */
  privacyPolicyConfirmed: false,
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
 *   emailConfirmed    Utelämnas tyst. Telefonen är primär kontaktväg, så
 *                     sidan har en fungerande väg utan den.
 *   privacyPolicyConfirmed
 *                     Länken utelämnas. Sidan samlar i dag ingen
 *                     persondata, så det finns inget att beskriva ännu.
 */
/**
 * Breddande läsare för telefonläget. Exakt samma mekanik och exakt samma
 * skäl som phoneDisplay(): string | null längre ned.
 *
 * Inuti `as const` smalnar phoneStatus till literalen 'platshallare', och
 * TypeScript vet därför att `=== 'bekraftat'` alltid är falskt. För en
 * boolean är den smalningen en fördel — den visar vilken gren som lever.
 * För en tre-lägesunion blir varje jämförelse ett TYPFEL i stället:
 * ts(2367) på spärren och på JSON-LD-grenen, ts(2678) på switchen i
 * telefonVy. Mätt, 3 fel i astro check.
 *
 * Returtypsannoteringen breddar tillbaka till unionen, så alla tre
 * grenarna står kvar som möjliga. Det är korrekt: värdet sätts av en
 * människa och koden måste hantera alla tre.
 *
 * Jämför ALDRIG COMPANY.phoneStatus direkt — gå via den här.
 */
export const telefonLage = (): TelefonLage => COMPANY.phoneStatus;

const LANSERINGSSPARRAR: ReadonlyArray<readonly [string, boolean, string]> = [
  ['phoneStatus', telefonLage() === 'bekraftat', 'telefonnumret — sidans enda konvertering'],
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

/**
 * Alla synliga plattformsnycklar. Ren diagnostik för byggloggen.
 *
 * Täcker BÅDA Cloudflare-produkterna. Pages sätter CF_PAGES*, Workers
 * Builds sätter WORKERS_CI*. Filtrerar den här bara på det ena prefixet
 * rapporterar loggen "(inga)" på den andra plattformen, och då ser det ut
 * som att Cloudflare inte sätter något alls — vilket var precis den
 * slutsats som ledde fel förra gången.
 */
const synligaPlattformsnycklar = (): string[] => {
  const p = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process;
  if (!p?.env) return [];
  return Object.keys(p.env)
    .filter(
      (k) => k === 'CI' || k.startsWith('CF_') || k.startsWith('WORKERS_CI'),
    )
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
 * produktion), så PROD ensamt kan inte avgöra frågan.
 *
 * TVÅ VARIABELUPPSÄTTNINGAR, EN LOGIK.
 *
 * Cloudflare har två produkter som bygger ur git, och de sätter olika
 * miljövariabler:
 *
 *   Pages           CF_PAGES, CF_PAGES_BRANCH, CF_PAGES_COMMIT_SHA
 *   Workers Builds  WORKERS_CI, WORKERS_CI_BRANCH, WORKERS_CI_COMMIT_SHA
 *
 * Funktionen letade tidigare bara efter CF_PAGES*. Under Workers Builds
 * fanns ingen av dem, paCloudflare blev false, och bygget föll igenom
 * till 'lokal-produktion' och vägrade. Spärren gjorde alltså rätt — den
 * såg ingen känd plattform och antog produktion — men diagnosen såg ut
 * som ett fel i Cloudflare i stället för som en lucka här.
 *
 * Grenlogiken och fail-closed-beteendet är OFÖRÄNDRADE. Det enda som
 * ändras är vilka nycklar som räknas som "vi står på Cloudflare".
 * Kontextnamnen behåller cf-prefixet med flit: de beskriver byggets
 * NATUR — preview, produktion, okänd gren — inte vilken produkt som
 * kördes. Vilken produkt det var syns i byggloggen i stället.
 *
 * Okänd gren på Cloudflare är fail-closed: vet vi inte var vi är, bygger
 * vi inte med platshållare.
 */
export const byggkontext = (): Byggkontext => {
  // import.meta.env.PROD är avsiktligt kvar: den SKA vara kompiletidsvärde,
  // eftersom den skiljer `astro dev` från `astro build`. Allt som beror på
  // körmiljön går via env() ovan.
  if (!import.meta.env.PROD) return 'dev';

  // Grennamnet, från vilken av produkterna som än kör. Pages först bara
  // för att den uppsättningen fanns här först — ordningen har ingen
  // betydelse, de kan inte båda vara satta.
  const gren = env('CF_PAGES_BRANCH') ?? env('WORKERS_CI_BRANCH');

  // Ingen enskild nyckel räcker som plattformssignal. Sätter Cloudflare
  // av någon anledning inte flaggan ska grennamnet eller commit-hashen
  // ändå avslöja var vi är. Fler signaler, inte färre — och nu från båda
  // produkterna.
  const paCloudflare = Boolean(
    env('CF_PAGES') ??
      env('WORKERS_CI') ??
      gren ??
      env('CF_PAGES_COMMIT_SHA') ??
      env('WORKERS_CI_COMMIT_SHA'),
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
    `[kronoclean] Pages:   CF_PAGES=${visa('CF_PAGES')}` +
      ` CF_PAGES_BRANCH=${visa('CF_PAGES_BRANCH')}` +
      ` CF_PAGES_COMMIT_SHA=${env('CF_PAGES_COMMIT_SHA') ? 'satt' : '(saknas)'}`,
  );
  console.log(
    `[kronoclean] Workers: WORKERS_CI=${visa('WORKERS_CI')}` +
      ` WORKERS_CI_BRANCH=${visa('WORKERS_CI_BRANCH')}` +
      ` WORKERS_CI_COMMIT_SHA=${env('WORKERS_CI_COMMIT_SHA') ? 'satt' : '(saknas)'}` +
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
        `(grenen är ${PRODUKTIONSGREN}).\n\n` +
        'Den beviljar ingenting här och hör inte hemma i production-scopet.\n' +
        'Ta bort den i projektets Settings > Variables and Secrets.\n' +
        'Gäller både Pages och Workers Builds.\n' +
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
        'Ingen miljövariabel behövs — undantaget härleds ur grennamnet.\n' +
        'Pages bygger andra grenar som preview som standard; Workers Builds\n' +
        'kräver att preview-deploys är påslagna för projektet.\n'
      : kontext === 'cf-okand-gren'
        ? 'En Cloudflare-signal är satt men inget grennamn finns — varken\n' +
          'CF_PAGES_BRANCH eller WORKERS_CI_BRANCH. Bygget kan då inte\n' +
          'avgöra om detta är produktion. Fail-closed: vi vägrar.\n'
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
 * Sista steget i "Så går det till". Segmentberoende av samma skäl som
 * trustMarkers, men konsekvensen är hårdare här: steg 4 är hela
 * anledningen till att sektionen finns. RUT-mekaniken är det enda i
 * affären som folk faktiskt inte förstår, och en företagskund som läser
 * "RUT-avdraget är redan avdraget" får veta något som är falskt om just
 * hennes faktura.
 *
 * Alternativet — en formulering som rymmer båda — provades och
 * förkastades. Den blir ofrånkomligen villkorad ("om du är privatperson
 * dras RUT direkt"), och en brasklapp mitt i det steg som ska ta bort
 * osäkerhet lägger tillbaka precis den osäkerhet sektionen finns för att
 * ta bort. Två korta sanna versioner slår en lång hedgad.
 *
 * Procentsatsen läses ur COMPANY.rutPercent så texten inte kan glida
 * ifrån regeln den beskriver.
 */
export const fakturaSteg = (
  segment: SegmentId,
): { rubrik: string; text: string } =>
  SEGMENT[segment].rut
    ? {
        rubrik: 'Faktura med RUT redan avdraget',
        text:
          `Du får fakturan efteråt, och ${COMPANY.rutPercent} % av ` +
          'arbetskostnaden är redan avdragen. Du betalar bara det som ' +
          'återstår — det finns inget att ansöka om, och du lägger aldrig ' +
          'ut för avdraget själv. Vi begär resten från Skatteverket.',
      }
    : {
        rubrik: 'Faktura',
        text:
          'Du får fakturan efter utfört arbete, med sedvanliga ' +
          'betalningsvillkor. RUT är ett avdrag för privatpersoner och ' +
          'gäller inte företag.',
      };

/**
 * Spärrade läsare. Returtypen är explicit `string | null` — utan den
 * skulle TypeScript smalna till `null` (flaggan är literalen false inuti
 * `as const`) och konsumenten skulle tappa string-grenen.
 */
/**
 * Telefonvyn som DISKRIMINERAD UNION, inte som två oberoende läsare.
 *
 * Poängen ligger i typerna: `href` finns bara på 'bekraftat'-varianten.
 * En komponent som försöker rendera en tel:-länk i platshållarläget
 * kompilerar därför inte — misstaget är inte otillåtet, det är
 * orepresenterbart. Med två nullable-läsare hade
 * `telefon && <a href={telefonHref}>` sett rimligt ut och tyst gett en
 * länk till `null` när platshållaren visades.
 *
 * `aldrigKlickbar` finns för att göra avsikten läsbar på anropssidan.
 * Den bär ingen logik — den finns för att den som läser markup ska se
 * varför det inte står någon <a> där.
 */
export type TelefonVy =
  | { lage: 'bekraftat'; text: string; href: string }
  | { lage: 'platshallare'; text: string; aldrigKlickbar: true }
  | { lage: 'dolt' };

export const telefonVy = (): TelefonVy => {
  switch (telefonLage()) {
    case 'bekraftat':
      return { lage: 'bekraftat', text: COMPANY.phone, href: COMPANY.phoneHref };
    case 'platshallare':
      return {
        lage: 'platshallare',
        text: COMPANY.phonePlatshallare,
        aldrigKlickbar: true,
      };
    default:
      return { lage: 'dolt' };
  }
};

/**
 * Företagsuppgifter till sidfoten. Egen lista, inte trustMarkers:
 * markörerna säljer ("50 % RUT-avdrag"), sidfoten redovisar. Samma
 * flaggor styr båda, så inget kan bli sant på ett ställe och falskt på
 * det andra.
 */
export const foretagsuppgifter = (): string[] => {
  const rader: string[] = [];
  const nr = orgNr();
  if (nr) rader.push(`Org.nr ${nr}`);
  if (COMPANY.hasFTax) rader.push('Godkänd för F-skatt');
  if (COMPANY.hasInsurance) rader.push('Ansvarsförsäkrad');
  return rader;
};

/** Mejladressen, eller null tills den är bekräftad. */
export const emailAdress = (): string | null =>
  COMPANY.emailConfirmed ? COMPANY.email : null;

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
  /** Matchar --palett-mist i global.css så webbläsarfältet smälter in.
   *  Följer alltid med när mist ändras — annars ljuger adressfältet. */
  themeColor: '#E1EEFE',
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

    ...(telefonLage() === 'bekraftat'
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
