export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    KHR: '៛',
    // Add more currencies as needed
  };
  return symbols[currency] || currency;
};

export const convertCurrency = (
  amount: number, 
  from: string, 
  to: string, 
  exchangeRates: { KHR_USD: number }
): number => {
  if (from === to) return amount;
  
  if (from === 'KHR' && to === 'USD') {
    return amount / exchangeRates.KHR_USD;
  }
  if (from === 'USD' && to === 'KHR') {
    return amount * exchangeRates.KHR_USD;
  }
  
  return amount;
};

export const formatCurrency = (amount: number, currency: string): string => {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: currency === 'KHR' ? 0 : 2,
    maximumFractionDigits: currency === 'KHR' ? 0 : 2
  })}`;
};
