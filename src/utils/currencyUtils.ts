import { SUPPORTED_CURRENCIES } from './constants';

export const getCurrencySymbol = (currency: string): string => {
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency);
  return currencyInfo?.symbol || currency;
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

export const getEditableAmount = (
  transaction: {
    amount: number;
    originalAmount?: number;
    originalCurrency?: string;
  },
  currency: string,
  exchangeRate: number
): number => {
  if (currency === 'KHR' && transaction.originalCurrency === 'KHR') {
    return transaction.originalAmount || transaction.amount;
  }
  if (currency === 'USD' && transaction.originalCurrency === 'KHR') {
    return transaction.amount * exchangeRate;
  }
  return Math.abs(transaction.amount);
};