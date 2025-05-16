export const SUPPORTED_CURRENCIES = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'KHR', label: 'Cambodian Riel', symbol: '៛' }
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];
