// Genererar public/favicon.svg, public/favicon.ico och
// public/apple-touch-icon.png ur public/kronoclean-logo.webp.
//
// Körs för hand, inte av bygget:  node scripts/generera-ikoner.mjs
// Se scripts/README.md för när den behöver köras om.
//
// VAD DEN GÖR, i ordning:
//   1. Läser loggans alfakanal och märker sammanhängande komponenter.
//   2. Väljer KRONAN: den största komponenten vars underkant ligger i
//      bildens översta 30 %. Det är ett antagande om loggans komposition
//      (kronan sitter överst, mitt över taket) och kontrolleras med en
//      proportionsspärr — byts loggan ska utskriften granskas.
//   3. Spårar komponentens ytterkontur (Moore-spårning med Jacobs
//      stoppkriterium) och förenklar den (Douglas-Peucker, 0,6 px).
//   4. Rastrerar vektorn tillbaka och jämför med masken: IoU skrivs ut.
//      Under 0,95 är något fel.
//   5. Skriver tre filer. Färgerna läses ur global.css: --palett-navy
//      för kronan, --palett-mist för plattan.
//
// Plattan är inte dekor. Kronan är navy och en flikrad kan vara vit eller
// nästan svart; på mist står den på en känd yta med 11.02 i kontrast.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROT = fileURLToPath(new URL('..', import.meta.url));
const LOGGA = path.join(ROT, 'public', 'kronoclean-logo.webp');
const PUB = path.join(ROT, 'public');

// ---------- paletten, ur samma fil som sajten ----------
const CSS = fs.readFileSync(path.join(ROT, 'src', 'styles', 'global.css'), 'utf8');
const token = (namn) => {
  const m = CSS.match(new RegExp(`--palett-${namn}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`hittar inte --palett-${namn} i src/styles/global.css`);
  return m[1].toUpperCase();
};
const NAVY = token('navy');
const MIST = token('mist');

// ---------- 1. alfamask ----------
const { data, info } = await sharp(LOGGA).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const ink = new Uint8Array(W * H);
for (let p = 0; p < W * H; p++) ink[p] = data[p * 4 + 3] >= 128 ? 1 : 0;

// ---------- 2. komponenter, 8-grannskap ----------
const lab = new Int32Array(W * H).fill(-1);
const stack = new Int32Array(W * H);
const komp = [];
for (let p = 0; p < W * H; p++) {
  if (!ink[p] || lab[p] !== -1) continue;
  let sp = 0;
  stack[sp++] = p;
  lab[p] = komp.length;
  const c = { x0: W, x1: -1, y0: H, y1: -1, area: 0, pixlar: [] };
  while (sp) {
    const q = stack[--sp];
    const x = q % W;
    const y = (q - x) / W;
    c.area++;
    c.pixlar.push(q);
    if (x < c.x0) c.x0 = x;
    if (x > c.x1) c.x1 = x;
    if (y < c.y0) c.y0 = y;
    if (y > c.y1) c.y1 = y;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const r = ny * W + nx;
        if (ink[r] && lab[r] === -1) {
          lab[r] = komp.length;
          stack[sp++] = r;
        }
      }
    }
  }
  komp.push(c);
}

const kandidater = komp.filter((c) => c.y1 < 0.3 * H && c.area > 500).sort((a, b) => b.area - a.area);
if (!kandidater.length) throw new Error('hittar ingen komponent i loggans översta 30 % — har loggan bytt komposition?');
const krona = kandidater[0];
const kw0 = krona.x1 - krona.x0 + 1;
const kh0 = krona.y1 - krona.y0 + 1;
const kvot = kw0 / kh0;
console.log(`kronan: x ${krona.x0}-${krona.x1}  y ${krona.y0}-${krona.y1}  ${kw0}x${kh0}  kvot ${kvot.toFixed(2)}  area ${krona.area} px`);
if (kvot < 1.2 || kvot > 1.8) throw new Error(`komponenten har kvot ${kvot.toFixed(2)}, kronan brukar ligga runt 1.5 — granska loggan`);

// ---------- 3. beskär till kronan + 2 px, spåra konturen ----------
const M = 2;
const cx0 = krona.x0 - M;
const cy0 = krona.y0 - M;
const cw = kw0 + 2 * M;
const ch = kh0 + 2 * M;
const mask = new Uint8Array(cw * ch);
for (const q of krona.pixlar) {
  const x = (q % W) - cx0;
  const y = (q - (q % W)) / W - cy0;
  mask[y * cw + x] = 1;
}
const inne = (x, y) => x >= 0 && y >= 0 && x < cw && y < ch && mask[y * cw + x] === 1;

function spara() {
  let sx = -1;
  let sy = -1;
  yttre: for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      if (inne(x, y)) {
        sx = x;
        sy = y;
        break yttre;
      }
    }
  }
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]; // medurs från öst, y nedåt
  const steg = (x, y, dir) => {
    for (let k = 0; k < 8; k++) {
      const d = (dir + 5 + k) % 8;
      const nx = x + dirs[d][0];
      const ny = y + dirs[d][1];
      if (inne(nx, ny)) return [nx, ny, d];
    }
    return null;
  };
  const pts = [[sx, sy]];
  const forsta = steg(sx, sy, 0);
  if (!forsta) return pts;
  let [x, y, dir] = forsta;
  pts.push([x, y]);
  let vakt = 0;
  while (vakt++ < cw * ch * 4) {
    const n = steg(x, y, dir);
    if (!n) break;
    [x, y, dir] = n;
    if (x === sx && y === sy) {
      // Jacobs kriterium: tillbaka på start OCH nästa steg är samma pixel
      // som andra gången. Att bara stanna vid start vänder vid en spets.
      const titt = steg(x, y, dir);
      if (titt && titt[0] === pts[1][0] && titt[1] === pts[1][1]) break;
    }
    pts.push([x, y]);
  }
  return pts;
}

function forenkla(pts, tol) {
  if (pts.length < 3) return pts;
  const d2 = (p, a, b) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    const px = a[0] + t * dx - p[0];
    const py = a[1] + t * dy - p[1];
    return px * px + py * py;
  };
  const behall = new Uint8Array(pts.length);
  behall[0] = behall[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [i, j] = st.pop();
    let mx = 0;
    let mi = -1;
    for (let k = i + 1; k < j; k++) {
      const dd = d2(pts[k], pts[i], pts[j]);
      if (dd > mx) {
        mx = dd;
        mi = k;
      }
    }
    if (mx > tol * tol && mi > 0) {
      behall[mi] = 1;
      st.push([i, mi], [mi, j]);
    }
  }
  return pts.filter((_, i) => behall[i]);
}

const TOL = 0.6;
const kontur = forenkla(spara(), TOL);
const d = 'M' + kontur.map((p) => `${p[0]} ${p[1]}`).join('L') + 'Z';

// ---------- 4. IoU ----------
const kontrollSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}" viewBox="0 0 ${cw} ${ch}"><path fill="#000" d="${d}"/></svg>`;
const rast = await sharp(Buffer.from(kontrollSvg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let snitt = 0;
let union = 0;
for (let p = 0; p < cw * ch; p++) {
  const a = rast.data[p * 4 + 3] >= 128 ? 1 : 0;
  const b = mask[p];
  if (a && b) snitt++;
  if (a || b) union++;
}
const iou = snitt / union;
console.log(`kontur: ${kontur.length} punkter efter Douglas-Peucker ${TOL} px · IoU mot masken ${iou.toFixed(4)}`);
if (iou < 0.95) throw new Error(`IoU ${iou.toFixed(3)} — spårningen stämmer inte med masken`);

// ---------- 5. filerna ----------
const platta = (S, inre, rx) => {
  const kw = S * inre;
  const kh = kw * (ch / cw);
  const kx = (S - kw) / 2;
  const ky = (S - kh) / 2;
  const rect = `<rect width="${S}" height="${S}"${rx ? ` rx="${(S * rx).toFixed(2)}"` : ''} fill="${MIST}"/>`;
  return { rect, path: `<path fill="${NAVY}" transform="translate(${kx.toFixed(3)} ${ky.toFixed(3)}) scale(${(kw / cw).toFixed(6)})" d="${d}"/>` };
};
const svgAv = (S, inre, rx) => {
  const { rect, path: p } = platta(S, inre, rx);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${rect}${p}</svg>`;
};
const INRE = 0.74; // kronans bredd som andel av plattan
const RX = 0.22; // hörnradie som andel av sidan

// favicon.svg — viewBox 64, sökvägen i sina egna enheter via transform
const { rect, path: kronPath } = platta(64, INRE, RX);
const iouText = iou.toFixed(3).replace('.', ',');
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <!--
    Kronan ur kronoclean-logo.webp, spårad ur alfakanalen: Moore-spårning
    av komponenten x ${krona.x0}-${krona.x1} / y ${krona.y0}-${krona.y1}, förenklad med Douglas-Peucker
    (${String(TOL).replace('.', ',')} px) till ${kontur.length} punkter. Rastrerad tillbaka mot masken: IoU ${iouText}.
    Fyllningen är palettens navy ${NAVY}, plattan --palett-mist ${MIST}.
    Genererad av scripts/generera-ikoner.mjs - redigera inte för hand.
  -->
  ${rect}
  ${kronPath}
</svg>
`;
fs.writeFileSync(path.join(PUB, 'favicon.svg'), faviconSvg);

// apple-touch-icon.png — 180 px, raka hörn (iOS maskar själv, och
// transparens komponeras mot svart där, så plattan är heltäckande)
await sharp(Buffer.from(svgAv(180, INRE, 0))).png().toFile(path.join(PUB, 'apple-touch-icon.png'));

// favicon.ico — PNG-poster i 16/32/48 (Vista+ och alla moderna webbläsare)
const poster = [];
for (const S of [16, 32, 48]) poster.push([S, await sharp(Buffer.from(svgAv(S, INRE, RX))).png().toBuffer()]);
const huvud = Buffer.alloc(6);
huvud.writeUInt16LE(0, 0); // reserverat
huvud.writeUInt16LE(1, 2); // typ: ikon
huvud.writeUInt16LE(poster.length, 4);
const katalog = Buffer.alloc(16 * poster.length);
let offset = 6 + katalog.length;
poster.forEach(([S, buf], i) => {
  const o = i * 16;
  katalog.writeUInt8(S >= 256 ? 0 : S, o);
  katalog.writeUInt8(S >= 256 ? 0 : S, o + 1);
  katalog.writeUInt8(0, o + 2); // palett
  katalog.writeUInt8(0, o + 3); // reserverat
  katalog.writeUInt16LE(1, o + 4); // plan
  katalog.writeUInt16LE(32, o + 6); // bitar per pixel
  katalog.writeUInt32LE(buf.length, o + 8);
  katalog.writeUInt32LE(offset, o + 12);
  offset += buf.length;
});
fs.writeFileSync(path.join(PUB, 'favicon.ico'), Buffer.concat([huvud, katalog, ...poster.map((p) => p[1])]));

for (const f of ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png']) {
  console.log(`skrev public/${f}  ${fs.statSync(path.join(PUB, f)).size} B`);
}
console.log(`färger ur global.css: navy ${NAVY} · mist ${MIST}`);
