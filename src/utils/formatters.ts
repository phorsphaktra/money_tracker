export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KHR',
    minimumFractionDigits: 2
  }).format(amount);
};
