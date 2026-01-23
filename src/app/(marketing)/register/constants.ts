export const STEPS = [
  { number: 1, label: 'Company' },
  { number: 2, label: 'Billing' },
  { number: 3, label: 'Account' },
  { number: 4, label: 'Review' }
]

export const INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Technology' },
  { value: 'telecom', label: 'Telecommunications' },
  { value: 'healthcare', label: 'Healthcare / Hospital' },
  { value: 'finance', label: 'Finance / Banking' },
  { value: 'retail', label: 'Retail / E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'education', label: 'Education' },
  { value: 'government', label: 'Government' },
  { value: 'nonprofit', label: 'Non-Profit' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'hospitality', label: 'Hospitality / Tourism' },
  { value: 'media', label: 'Media / Entertainment' },
  { value: 'logistics', label: 'Logistics / Transportation' },
  { value: 'energy', label: 'Energy / Utilities' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'construction', label: 'Construction' },
  { value: 'legal', label: 'Legal Services' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'other', label: 'Other' }
]

export const ADDRESS_LABELS: Record<string, { state: string; zip: string; city: string }> = {
  US: { state: 'State', zip: 'ZIP Code', city: 'City' },
  CA: { state: 'Province', zip: 'Postal Code', city: 'City' },
  GB: { state: 'County', zip: 'Postcode', city: 'City' },
  AU: { state: 'State/Territory', zip: 'Postcode', city: 'Suburb' },
  DE: { state: 'Bundesland', zip: 'PLZ', city: 'Stadt' },
  FR: { state: 'Région', zip: 'Code Postal', city: 'Ville' },
  IT: { state: 'Provincia', zip: 'CAP', city: 'Città' },
  ES: { state: 'Provincia', zip: 'Código Postal', city: 'Ciudad' },
  NL: { state: 'Province', zip: 'Postcode', city: 'City' },
  BE: { state: 'Province', zip: 'Code Postal', city: 'City' },
  CH: { state: 'Canton', zip: 'PLZ', city: 'City' },
  AT: { state: 'Bundesland', zip: 'PLZ', city: 'Stadt' },
  MX: { state: 'Estado', zip: 'Código Postal', city: 'Ciudad' },
  BR: { state: 'Estado', zip: 'CEP', city: 'Cidade' },
  AR: { state: 'Provincia', zip: 'Código Postal', city: 'Ciudad' },
  JP: { state: 'Prefecture', zip: 'Postal Code', city: 'City' },
  CN: { state: 'Province', zip: 'Postal Code', city: 'City' },
  IN: { state: 'State', zip: 'PIN Code', city: 'City' },
  KR: { state: 'Province', zip: 'Postal Code', city: 'City' },
  NZ: { state: 'Region', zip: 'Postcode', city: 'City' },
  ZA: { state: 'Province', zip: 'Postal Code', city: 'City' },
  IE: { state: 'County', zip: 'Eircode', city: 'City' },
  PL: { state: 'Voivodeship', zip: 'Postal Code', city: 'City' },
  SE: { state: 'County', zip: 'Postal Code', city: 'City' },
  NO: { state: 'County', zip: 'Postal Code', city: 'City' },
  DK: { state: 'Region', zip: 'Postal Code', city: 'City' },
  FI: { state: 'Region', zip: 'Postal Code', city: 'City' },
  PT: { state: 'District', zip: 'Código Postal', city: 'City' },
  RU: { state: 'Oblast', zip: 'Postal Code', city: 'City' },
  AE: { state: 'Emirate', zip: 'P.O. Box', city: 'City' },
  SG: { state: 'District', zip: 'Postal Code', city: 'City' },
  HK: { state: 'District', zip: '', city: 'City' },
  PH: { state: 'Province', zip: 'ZIP Code', city: 'City' },
  MY: { state: 'State', zip: 'Postcode', city: 'City' },
  TH: { state: 'Province', zip: 'Postal Code', city: 'City' },
  ID: { state: 'Province', zip: 'Postal Code', city: 'City' },
  VN: { state: 'Province', zip: 'Postal Code', city: 'City' },
}

export const DEFAULT_ADDRESS_LABELS = { state: 'State / Province', zip: 'Postal Code', city: 'City' }

export const getAddressLabels = (countryCode: string) => {
  return ADDRESS_LABELS[countryCode] || DEFAULT_ADDRESS_LABELS
}
