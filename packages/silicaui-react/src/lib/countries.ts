/**
 * A curated, dependency-free country / calling-code dataset for `PhoneInput`.
 * Covers the common set of countries most consumer/business forms need;
 * pass a custom `countries` list to `PhoneInput` to extend or replace it.
 */
export interface Country {
  /** ISO 3166-1 alpha-2 code, e.g. `"US"`. */
  iso2: string;
  /** English display name. */
  name: string;
  /** E.164 calling code, without the leading `+`, e.g. `"1"`. */
  dial: string;
}

export const COUNTRIES: Country[] = [
  { iso2: "US", name: "United States", dial: "1" },
  { iso2: "CA", name: "Canada", dial: "1" },
  { iso2: "MX", name: "Mexico", dial: "52" },
  { iso2: "BR", name: "Brazil", dial: "55" },
  { iso2: "AR", name: "Argentina", dial: "54" },
  { iso2: "CL", name: "Chile", dial: "56" },
  { iso2: "CO", name: "Colombia", dial: "57" },
  { iso2: "PE", name: "Peru", dial: "51" },
  { iso2: "GB", name: "United Kingdom", dial: "44" },
  { iso2: "IE", name: "Ireland", dial: "353" },
  { iso2: "FR", name: "France", dial: "33" },
  { iso2: "DE", name: "Germany", dial: "49" },
  { iso2: "ES", name: "Spain", dial: "34" },
  { iso2: "PT", name: "Portugal", dial: "351" },
  { iso2: "IT", name: "Italy", dial: "39" },
  { iso2: "NL", name: "Netherlands", dial: "31" },
  { iso2: "BE", name: "Belgium", dial: "32" },
  { iso2: "LU", name: "Luxembourg", dial: "352" },
  { iso2: "CH", name: "Switzerland", dial: "41" },
  { iso2: "AT", name: "Austria", dial: "43" },
  { iso2: "SE", name: "Sweden", dial: "46" },
  { iso2: "NO", name: "Norway", dial: "47" },
  { iso2: "DK", name: "Denmark", dial: "45" },
  { iso2: "FI", name: "Finland", dial: "358" },
  { iso2: "IS", name: "Iceland", dial: "354" },
  { iso2: "PL", name: "Poland", dial: "48" },
  { iso2: "CZ", name: "Czechia", dial: "420" },
  { iso2: "SK", name: "Slovakia", dial: "421" },
  { iso2: "HU", name: "Hungary", dial: "36" },
  { iso2: "RO", name: "Romania", dial: "40" },
  { iso2: "BG", name: "Bulgaria", dial: "359" },
  { iso2: "GR", name: "Greece", dial: "30" },
  { iso2: "HR", name: "Croatia", dial: "385" },
  { iso2: "SI", name: "Slovenia", dial: "386" },
  { iso2: "EE", name: "Estonia", dial: "372" },
  { iso2: "LV", name: "Latvia", dial: "371" },
  { iso2: "LT", name: "Lithuania", dial: "370" },
  { iso2: "UA", name: "Ukraine", dial: "380" },
  { iso2: "RU", name: "Russia", dial: "7" },
  { iso2: "TR", name: "Turkey", dial: "90" },
  { iso2: "IL", name: "Israel", dial: "972" },
  { iso2: "AE", name: "United Arab Emirates", dial: "971" },
  { iso2: "SA", name: "Saudi Arabia", dial: "966" },
  { iso2: "QA", name: "Qatar", dial: "974" },
  { iso2: "KW", name: "Kuwait", dial: "965" },
  { iso2: "BH", name: "Bahrain", dial: "973" },
  { iso2: "OM", name: "Oman", dial: "968" },
  { iso2: "JO", name: "Jordan", dial: "962" },
  { iso2: "LB", name: "Lebanon", dial: "961" },
  { iso2: "EG", name: "Egypt", dial: "20" },
  { iso2: "ZA", name: "South Africa", dial: "27" },
  { iso2: "NG", name: "Nigeria", dial: "234" },
  { iso2: "KE", name: "Kenya", dial: "254" },
  { iso2: "GH", name: "Ghana", dial: "233" },
  { iso2: "MA", name: "Morocco", dial: "212" },
  { iso2: "DZ", name: "Algeria", dial: "213" },
  { iso2: "TN", name: "Tunisia", dial: "216" },
  { iso2: "ET", name: "Ethiopia", dial: "251" },
  { iso2: "IN", name: "India", dial: "91" },
  { iso2: "PK", name: "Pakistan", dial: "92" },
  { iso2: "BD", name: "Bangladesh", dial: "880" },
  { iso2: "LK", name: "Sri Lanka", dial: "94" },
  { iso2: "NP", name: "Nepal", dial: "977" },
  { iso2: "CN", name: "China", dial: "86" },
  { iso2: "JP", name: "Japan", dial: "81" },
  { iso2: "KR", name: "South Korea", dial: "82" },
  { iso2: "TW", name: "Taiwan", dial: "886" },
  { iso2: "HK", name: "Hong Kong", dial: "852" },
  { iso2: "MO", name: "Macao", dial: "853" },
  { iso2: "SG", name: "Singapore", dial: "65" },
  { iso2: "MY", name: "Malaysia", dial: "60" },
  { iso2: "TH", name: "Thailand", dial: "66" },
  { iso2: "VN", name: "Vietnam", dial: "84" },
  { iso2: "PH", name: "Philippines", dial: "63" },
  { iso2: "ID", name: "Indonesia", dial: "62" },
  { iso2: "KH", name: "Cambodia", dial: "855" },
  { iso2: "MM", name: "Myanmar", dial: "95" },
  { iso2: "AU", name: "Australia", dial: "61" },
  { iso2: "NZ", name: "New Zealand", dial: "64" },
  { iso2: "FJ", name: "Fiji", dial: "679" },
  { iso2: "JM", name: "Jamaica", dial: "1" },
  { iso2: "TT", name: "Trinidad and Tobago", dial: "1" },
  { iso2: "BS", name: "Bahamas", dial: "1" },
  { iso2: "BB", name: "Barbados", dial: "1" },
  { iso2: "DO", name: "Dominican Republic", dial: "1" },
  { iso2: "PR", name: "Puerto Rico", dial: "1" },
  { iso2: "CU", name: "Cuba", dial: "53" },
  { iso2: "GT", name: "Guatemala", dial: "502" },
  { iso2: "CR", name: "Costa Rica", dial: "506" },
  { iso2: "PA", name: "Panama", dial: "507" },
  { iso2: "HN", name: "Honduras", dial: "504" },
  { iso2: "SV", name: "El Salvador", dial: "503" },
  { iso2: "NI", name: "Nicaragua", dial: "505" },
  { iso2: "EC", name: "Ecuador", dial: "593" },
  { iso2: "BO", name: "Bolivia", dial: "591" },
  { iso2: "PY", name: "Paraguay", dial: "595" },
  { iso2: "UY", name: "Uruguay", dial: "598" },
  { iso2: "VE", name: "Venezuela", dial: "58" },
  { iso2: "CY", name: "Cyprus", dial: "357" },
  { iso2: "MT", name: "Malta", dial: "356" },
  { iso2: "SC", name: "Seychelles", dial: "248" },
];

/** Deduped by ISO2 so a copy/paste mistake above can't ship a dupe key. */
export const DEFAULT_COUNTRIES: Country[] = Array.from(
  new Map(COUNTRIES.map((c) => [c.iso2, c])).values(),
);

/** Renders an ISO 3166-1 alpha-2 code as its Unicode regional-indicator flag emoji. */
export function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export function findCountry(
  iso2: string,
  countries: Country[] = DEFAULT_COUNTRIES,
): Country | undefined {
  return countries.find((c) => c.iso2 === iso2.toUpperCase());
}
