export interface FinancialMetrics {
  monthlyAverage: number;
  savingsRate: number;
  financialHealth: string;
  healthMessage: string;
  hasIncreasedSpending: boolean;
  lastUpdated: string;
}

export interface MonthlyStats {
  thisMonth: number;
  lastMonth: number;
  change: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  type: 'income' | 'expense';
}

export interface HealthMetrics {
  score: number;
  status: string;
  message: string;
  details: {
    savingsHealth: number;
    spendingHealth: number;
    balanceHealth: number;
  };
}

export interface FinancialStats {
  savingsRate: number;
  spendingTrend: number;
  incomeTrend: number;
  monthlyAverage?: number;
  currentIncome?: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  monthlyDebt?: number;
  previousMonthExpenses?: number;
}
