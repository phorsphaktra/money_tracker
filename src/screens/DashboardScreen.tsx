import { useMemo } from 'react';
import { CardStats } from '../components/CardStats';
import { SpendingChart } from '../components/SpendingChart';
import { TransactionsList } from '../components/transaction/TransactionsList';
import { Transaction, useTransactions } from '../contexts/TransactionContext';
import { calculateDashboardStats } from '../utils/statsCalculator';

export const DashboardScreen = () => {
    const { transactions, isLoading, error } = useTransactions();
    
    const stats = useMemo(() => 
      calculateDashboardStats(transactions), [transactions]
    );

    if (isLoading) {
      return (
        <div className="grid gap-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (error) {
        return <DashboardError error={error} />;
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your financial activity
          </p>
        </header>
        
        <StatsGrid stats={stats} isLoading={isLoading} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Spending Overview
              </h3>
              <select className="text-sm border-gray-300 rounded-md">
                <option>Last 6 months</option>
                <option>Last 3 months</option>
                <option>This year</option>
              </select>
            </div>
            <SpendingChart 
              transactions={transactions} 
              isLoading={isLoading} 
            />
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Transactions
              </h3>
              <button onClick={() => {}} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                View All →
              </button>
            </div>
            <TransactionsList 
              transactions={transactions}
              isLoading={isLoading}
              limit={5}
              showFilters={false}
            />
          </div>
        </div>
      </div>
    );
};

const DashboardSkeleton = () => (
  <div className="flex justify-center items-center h-64">
    Loading...
  </div>
);

const DashboardError = ({ error }: { error: Error }) => (
  <div className="text-red-500">Error: {error.message}</div>
);

const StatsGrid = ({ stats, isLoading }: { stats: ReturnType<typeof calculateDashboardStats>, isLoading: boolean }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <CardStats
      title="Total Balance"
      value={`$${stats.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
      trend={`${stats.balanceTrend}%`}
      isPositive={Number(stats.balanceTrend) >= 0}
      isLoading={isLoading}
    />
    <CardStats
      title="Monthly Spending"
      value={`$${stats.currentSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
      trend={`${stats.spendingTrend}%`}
      isPositive={Number(stats.spendingTrend) < 0}
      isLoading={isLoading}
    />
    <CardStats
      title="Monthly Income"
      value={`$${stats.currentIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
      trend={`${stats.incomeTrend}%`}
      isPositive={Number(stats.incomeTrend) >= 0}
      isLoading={isLoading}
    />
    <CardStats
      title="Savings Rate"
      value={`${stats.savingsRate}%`}
      trend={`${stats.savingsTrend}%`}
      isPositive={Number(stats.savingsTrend) >= 0}
      isLoading={isLoading}
    />
  </div>
);

const ChartsSection = ({ transactions, isLoading }: { transactions: Transaction[], isLoading: boolean }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Spending Overview
      </h3>
      <SpendingChart 
        transactions={transactions} 
        isLoading={isLoading} 
      />
    </div>
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Transactions
      </h3>
      <TransactionsList 
        transactions={transactions}
        isLoading={isLoading}
        limit={5}
        showFilters={false}
      />
    </div>
  </div>
);
