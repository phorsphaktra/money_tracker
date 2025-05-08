import { MonthlyStats, HealthMetrics } from '../types/financial';

export const calculateMonthlyAverageAmount = (monthlyStats: MonthlyStats): number => {
  const { thisMonth, lastMonth } = monthlyStats;
  const validMonths = [thisMonth, lastMonth].filter(amount => amount > 0);
  return validMonths.length > 0 ? validMonths.reduce((a, b) => a + b, 0) / validMonths.length : 0;
};

export const formatMonthlyAverage = (
  amount: number,
  language: string,
  formatNumber: (num: number, language: string) => string
): string => {
  return `$${formatNumber(Math.max(0, amount), language)}`;
};

export const calculateDetailedHealth = (
  savingsRate: number,
  monthlyChange: number,
  averageSpending: number
): HealthMetrics => {
  try {
    // Validate and normalize inputs
    const metrics = calculateMetrics(
      validateNumber(savingsRate),
      validateNumber(monthlyChange),
      validateNumber(averageSpending)
    );

    const score = calculateHealthScore(metrics);
    return generateEnhancedHealthMetrics(score, metrics, savingsRate, monthlyChange);
  } catch (error) {
    console.error('Error calculating health metrics:', error);
    return getDefaultHealthMetrics();
  }
};

const validateNumber = (value: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return value;
};

const calculateMetrics = (
  savingsRate: number,
  monthlyChange: number,
  averageSpending: number
) => {
  const targetSavingsRate = 20; // 20% target savings rate
  const maxSpendingChange = 50; // 50% max spending change threshold
  
  return {
    savings: Math.min(100, Math.max(0, (savingsRate / targetSavingsRate) * 100)),
    spending: Math.max(0, Math.min(100, 100 - (Math.abs(monthlyChange) / maxSpendingChange) * 100)),
    balance: calculateBalanceHealth(averageSpending)
  };
};

const calculateBalanceHealth = (averageSpending: number): number => {
  if (averageSpending <= 0) return 0;
  if (averageSpending > 2000) return 100;
  return (averageSpending / 2000) * 100;
};

const calculateHealthScore = (metrics: Record<string, number>): number => {
  const weights = { savings: 0.4, spending: 0.35, balance: 0.25 };
  return Object.entries(metrics).reduce(
    (score, [key, value]) => score + (value * weights[key as keyof typeof weights]),
    0
  );
};

const getHealthStatus = (score: number): string => {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 50) return "warning";
  return "needs-attention";
};

const generateHealthMessage = (
  score: number,
  savingsRate: number,
  monthlyChange: number
): string => {
  const validScore = validateNumber(score);
  const validSavingsRate = validateNumber(savingsRate);
  const validChange = validateNumber(monthlyChange);
  
  if (validScore >= 90) {
    return `Outstanding financial health! Your savings rate of ${validSavingsRate.toFixed(1)}% is excellent. Keep maintaining these healthy habits!`;
  }
  
  if (validScore >= 75) {
    return validSavingsRate < 15
      ? `Good overall health. Consider increasing savings to above 15% (currently ${validSavingsRate.toFixed(1)}%) for better long-term stability.`
      : `Good financial standing. Your spending control is effective with a ${Math.abs(validChange).toFixed(1)}% change rate.`;
  }
  
  if (validScore >= 50) {
    return validSavingsRate <= 0
      ? "Warning: You're currently not saving. Focus on reducing expenses and building an emergency fund."
      : `Watch your spending trends (${validChange.toFixed(1)}% change) and try to increase savings when possible.`;
  }
  
  return validChange > 20
    ? `Critical: Your spending has increased by ${validChange.toFixed(1)}%. Review your budget immediately.`
    : `Important: Review your budget and identify areas to reduce expenses. Current savings rate: ${validSavingsRate.toFixed(1)}%`;
};

const generateEnhancedHealthMetrics = (
  score: number,
  metrics: Record<string, number>,
  savingsRate: number,
  monthlyChange: number
): HealthMetrics => {
  const status = getHealthStatus(score);
  const insights = generateInsights(savingsRate, monthlyChange);
  const baseMessage = generateHealthMessage(score, savingsRate, monthlyChange);

  return {
    score: Math.round(score),
    status,
    message: `${baseMessage}${insights.length ? `. ${insights.join('. ')}` : ''}`,
    details: {
      savingsHealth: Math.round(metrics.savings),
      spendingHealth: Math.round(metrics.spending),
      balanceHealth: Math.round(metrics.balance)
    }
  };
};

const generateInsights = (savingsRate: number, monthlyChange: number): string[] => {
  const validSavingsRate = validateNumber(savingsRate);
  const validChange = validateNumber(monthlyChange);
  const insights = [];
  
  if (validSavingsRate > 0) {
    insights.push(`Saving ${validSavingsRate.toFixed(1)}% of income`);
  }
  if (Math.abs(validChange) > 5) {
    insights.push(`${validChange > 0 ? 'Increased' : 'Decreased'} spending by ${Math.abs(validChange).toFixed(1)}%`);
  }

  return insights;
};

const getDefaultHealthMetrics = (): HealthMetrics => ({
  score: 0,
  status: 'needs-attention',
  message: 'Unable to calculate financial health. Please check your financial data.',
  details: {
    savingsHealth: 0,
    spendingHealth: 0,
    balanceHealth: 0
  }
});

