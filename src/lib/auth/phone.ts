export const PHONE_COUNTRIES = [
  { code: '+91', iso: 'IN', name: 'India' },
  { code: '+1', iso: 'US', name: 'United States' },
  { code: '+1', iso: 'CA', name: 'Canada' },
  { code: '+44', iso: 'GB', name: 'United Kingdom' },
  { code: '+61', iso: 'AU', name: 'Australia' },
  { code: '+971', iso: 'AE', name: 'United Arab Emirates' },
  { code: '+65', iso: 'SG', name: 'Singapore' },
  { code: '+977', iso: 'NP', name: 'Nepal' },
  { code: '+880', iso: 'BD', name: 'Bangladesh' },
  { code: '+94', iso: 'LK', name: 'Sri Lanka' },
  { code: '+92', iso: 'PK', name: 'Pakistan' },
  { code: '+975', iso: 'BT', name: 'Bhutan' },
  { code: '+86', iso: 'CN', name: 'China' },
  { code: '+81', iso: 'JP', name: 'Japan' },
  { code: '+82', iso: 'KR', name: 'South Korea' },
  { code: '+49', iso: 'DE', name: 'Germany' },
  { code: '+33', iso: 'FR', name: 'France' },
  { code: '+60', iso: 'MY', name: 'Malaysia' },
  { code: '+62', iso: 'ID', name: 'Indonesia' },
  { code: '+63', iso: 'PH', name: 'Philippines' },
  { code: '+64', iso: 'NZ', name: 'New Zealand' },
  { code: '+966', iso: 'SA', name: 'Saudi Arabia' },
  { code: '+974', iso: 'QA', name: 'Qatar' },
] as const

export const DEFAULT_PHONE_COUNTRY_CODE = '+91'

const SUPPORTED_PHONE_COUNTRY_CODES = new Set(
  PHONE_COUNTRIES.map(({ code }) => code),
)

export function isSupportedPhoneCountryCode(value: string) {
  return SUPPORTED_PHONE_COUNTRY_CODES.has(
    value as (typeof PHONE_COUNTRIES)[number]['code'],
  )
}
