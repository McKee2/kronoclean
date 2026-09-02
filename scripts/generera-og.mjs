// Genererar public/og-kronoclean.jpg, 1200x630: loggan på mist med
// "Hemstädning i <ort>" i sajtens rubriksnitt under.
//
// Körs för hand, inte av bygget:  node scripts/generera-og.mjs
// Se scripts/README.md för när den behöver köras om.
//
// KÄLLORNA ÄR SAJTENS EGNA, inte kopior:
//   texten      COMPANY.city ur src/data/company.ts — samma sträng som H1
//   typsnittet  Archivo 800 ur .astro/fonts/, samma woff2 som sidan laddar.
//               Mappen är byggcache och ignorerad av git: finns den inte,
//               kör bygget en gång först (se README).
//   färgerna    --palett-mist och --palett-navy ur src/styles/global.css
//   måtten      SEO.ogImageWidth/Height ur company.ts, så metataggarna
//               inte kan glida ifrån filen
//
// Texten sätts som GLYFKONTURER via fontkitten (Astros egen fontparser),
// inte via ett systemtypsnitt. Förbehåll: fontkitten har ingen
// layoutmotor, så ingen GPOS-kerning tillämpas. Vid 48 px syns det inte.
//
// JPEG och inte WebP: LinkedIn hanterar inte WebP. Opak: transparens
// komponeras mot svart i flera klienter. Kroma 4:4:4: navy kanter mot ljus
// yta smetar med 4:2:0.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as fk from 'fontkitten';

const ROT = fileURLToPath(new URL('..', import.meta.url));
const PUB = path.join(ROT, 'public');
const LOGGA = path.join(PUB, 'kronoclean-logo.webp');

// ---------- källorna ----------
const { COMPANY, SEO } = await import(pathToFileURL(path.join(ROT, 'src', 'data', 'company.ts')).href);
const W = SEO.ogImageWidth;
const H = SEO.ogImageHeight;
const UTFIL = path.join(PUB, SEO.ogImagePath.replace(/^\//, ''));
if (!/\.jpe?g$/.test(UTFIL)) throw new Error(`SEO.ogImagePath är ${SEO.ogImagePath} — skriptet skriver JPEG`);

const CSS = fs.readFileSync(path.join(ROT, 'src', 'styles', 'global.css'), 'utf8');
const token = (namn) => {
  const m = CSS.match(new RegExp(`--palett-${namn}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`hittar inte --palett-${namn} i src/styles/global.css`);
  return m[1].toUpperCase();
};
const MIST = token('mist');
const NAVY = token('navy');

const fontMapp = path.join(ROT, '.astro', 'fonts');
const fontFil = fs.existsSync(fontMapp)
  ? fs.readdirSync(fontMapp).find((f) => /^font-archivo-800-normal-latin-.*\.woff2$/.test(f))
  : undefined;
if (!fontFil) {
  throw new Error(
    'hittar inte Archivo 800 i .astro/fonts/. Mappen är byggcache — kör\n' +
      '  TILLAT_PLATSHALLARE=1 npm run build\n' +
      'en gång så laddas typsnittet ned, och kör sedan det här skriptet igen.',
  );
}
const kit = fk.default ?? fk;
const font = kit.create(fs.readFileSync(path.join(fontMapp, fontFil)));

// ---------- texten ----------
const TEXT = `Hemstädning i ${COMPANY.city}`.toUpperCase();
const STORLEK = 48; // px — 50 gav 635 px bredd, 5 px utanför säkra zonen
const SPARR = 0.02 * STORLEK; // samma spärr som H1
const s = STORLEK / font.unitsPerEm;
const glyfer = font.glyphsForString(TEXT);
const saknade = [...TEXT].filter((_, i) => glyfer[i].id === 0);
if (saknade.length) throw new Error(`typsnittet saknar glyfer för: ${saknade.join(' ')}`);
const textW = glyfer.reduce((sum, g) => sum + g.advanceWidth, 0) * s + SPARR * (glyfer.length - 1);
const versalH = font.capHeight * s;

// ---------- layout: loggan över, raden under, centrerat ----------
const LOGO_W = 600;
const meta = await sharp(LOGGA).metadata();
const LOGO_H = Math.round((LOGO_W * meta.height) / meta.width);
const GAP = 36;
const stackH = LOGO_H + GAP + versalH;
const topp = Math.round((H - stackH) / 2);
const logoLeft = Math.round((W - LOGO_W) / 2);
const baslinje = topp + LOGO_H + GAP + versalH;

let x = (W - textW) / 2;
let glyfPaths = '';
for (const g of glyfer) {
  // font-enheter har y uppåt; SVG har y nedåt, därav den negativa skalan
  glyfPaths += `<path transform="translate(${x.toFixed(2)} ${baslinje.toFixed(2)}) scale(${s.toFixed(6)} ${(-s).toFixed(6)})" d="${g.path.toSVG()}"/>`;
  x += g.advanceWidth * s + SPARR;
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${MIST}"/>
  <g fill="${NAVY}">${glyfPaths}</g>
</svg>`;

// Säker zon för kvadratisk beskärning (WhatsApp, vissa Slack-kort): mitten H×H.
const zonL = (W - H) / 2;
const zonR = zonL + H;
const textInom = (W - textW) / 2 >= zonL && (W + textW) / 2 <= zonR;
const loggaInom = logoLeft >= zonL && logoLeft + LOGO_W <= zonR;
if (!textInom) throw new Error(`texten "${TEXT}" är ${textW.toFixed(0)} px bred och går utanför säkra zonen ${zonL}-${zonR} — sänk STORLEK`);
if (!loggaInom) throw new Error('loggan går utanför säkra zonen — sänk LOGO_W');

const logo = await sharp(LOGGA).resize(LOGO_W, LOGO_H, { kernel: 'lanczos3' }).png().toBuffer();
const jpg = await sharp(Buffer.from(svg))
  .composite([{ input: logo, left: logoLeft, top: topp }])
  .jpeg({ quality: 88, progressive: true, chromaSubsampling: '4:4:4', mozjpeg: true })
  .toBuffer();
fs.writeFileSync(UTFIL, jpg);

console.log(
  JSON.stringify(
    {
      fil: path.relative(ROT, UTFIL).replace(/\\/g, '/'),
      matt: `${W}x${H}`,
      kB: +(jpg.length / 1024).toFixed(1),
      text: TEXT,
      storlek: STORLEK,
      textbredd: +textW.toFixed(1),
      versalhojd: +versalH.toFixed(1),
      logga: `${LOGO_W}x${LOGO_H} @ (${logoLeft},${topp})`,
      baslinje: +baslinje.toFixed(1),
      marginal: `${topp} upptill / ${H - Math.round(topp + stackH)} nedtill`,
      saker_zon: `${zonL}-${zonR}: text ${textInom ? 'inom' : 'UTANFÖR'}, logga ${loggaInom ? 'inom' : 'UTANFÖR'}`,
      typsnitt: fontFil,
      farger: `mist ${MIST} · navy ${NAVY}`,
    },
    null,
    1,
  ),
);
