# scripts/

Två skript som genererar bildfiler i `public/`. De körs **för hand**, inte
av bygget: filerna ändras bara när loggan, namnet eller paletten gör det,
och `sharp` + `fontkitten` i byggvägen hade kostat tid vid varje deploy
för ingenting.

| Skript | Skriver | Läser |
|---|---|---|
| `generera-ikoner.mjs` | `public/favicon.svg`, `public/favicon.ico` (16/32/48), `public/apple-touch-icon.png` (180) | `public/kronoclean-logo.webp`, `src/styles/global.css` |
| `generera-og.mjs` | `public/og-kronoclean.jpg` (1200×630) | `public/kronoclean-logo.webp`, `src/data/company.ts`, `src/styles/global.css`, `.astro/fonts/` |

```
npm run ikoner
npm run og
```

## När de ska köras om

| Ändring | Kör |
|---|---|
| Loggan byts (`public/kronoclean-logo.webp`) | båda |
| Orten eller namnet ändras i `company.ts` | `og` |
| `--palett-mist` eller `--palett-navy` ändras i `global.css` | båda |
| Rubriksnittet byts (annat än Archivo 800) | `og` — och uppdatera filmönstret i skriptet |
| `SEO.ogImagePath` eller måtten ändras | `og` |

Kör alltid båda efter ett loggabyte och granska utskriften: ikonskriptet
skriver ut vilken komponent det tog för kronan och dess IoU mot masken
(ska ligga över 0,95); OG-skriptet skriver ut textbredd och om allt
ligger inom den säkra zonen för kvadratisk beskärning.

## Förutsättningar

- `npm install` — `sharp` och `fontkitten` står som devDependencies. Båda
  är dessutom Astros egna beroenden, så de fanns redan i trädet; att de
  står i `package.json` är för att skripten inte ska gå sönder den dag
  Astro byter parser.
- För `og`: typsnittet läses ur `.astro/fonts/`, som är byggcache och
  ignorerad av git. Saknas mappen, kör `TILLAT_PLATSHALLARE=1 npm run
  build` en gång först. Skriptet säger själv till om den saknas.

## Antaganden som är värda att känna till

- Kronan hittas som den största sammanhängande komponenten i loggans
  översta 30 %, och proportionen kontrolleras (1,2–1,8). Byts loggan mot
  en med annan komposition måste det steget ses över.
- OG-texten sätts på **en rad** i 48 px och måste rymmas inom mittens
  630 px. Ett längre ortnamn får skriptet att stanna med ett felmeddelande
  — sänk då `STORLEK`.
- Ingen kerning i OG-texten: fontkitten har ingen layoutmotor. Par som
  VÄ sitter någon tiondels pixel lösare än i webbläsaren, osynligt i den
  storleken.

## Kontroll

Kör skripten två gånger i rad. Andra körningen ska lämna `git status`
rent — då är filerna i `public/` exakt vad skripten producerar, och inget
har redigerats för hand däremellan.
