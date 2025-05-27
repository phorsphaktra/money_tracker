import { Transaction } from '../contexts/TransactionContext';
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

export const calculateDisplayAmount = (
  transaction: Transaction,
  userCurrency: string,
  exchangeRate: number
): { displayAmount: number; showOriginal: boolean } => {
  // If transaction is in user's preferred currency, show as is
  if (transaction.originalCurrency === userCurrency) {
    return {
      displayAmount: transaction.originalAmount || transaction.amount,
      showOriginal: false
    };
  }

  // Convert USD to KHR
  if (userCurrency === 'KHR' && (!transaction.originalCurrency || transaction.originalCurrency === 'USD')) {
    return {
      displayAmount: Math.round(transaction.amount * exchangeRate),
      showOriginal: true
    };
  }

  // Convert KHR to USD
  if (userCurrency === 'USD' && transaction.originalCurrency === 'KHR') {
    return {
      displayAmount: transaction.amount,
      showOriginal: true
    };
  }

  // Default case
  return {
    displayAmount: Math.abs(transaction.amount),
    showOriginal: false
  };
};

export const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);