/**
 * Nordclean — single source of truth.
 *
 * Allt som kan ändras eller som ännu inte är bekräftat bor här.
 * Hårdkoda aldrig telefonnummer, orter eller priser i komponenterna.
 *
 * TODO-markerade fält måste bekräftas av kunden före lansering.
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
} as const;

/** Byggs av hasFTax/hasInsurance så inget osant kan hamna på sidan. */
export const trustMarkers = (): string[] => {
  const markers: string[] = [];
  if (COMPANY.hasFTax) markers.push('F-skatt');
  if (COMPANY.hasInsurance) markers.push('Ansvarsförsäkrad');
  markers.push(`${COMPANY.rutPercent} % RUT-avdrag`);
  return markers;
};
