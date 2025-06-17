import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChartPieIcon,
  ScaleIcon,
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PresentationChartLineIcon,
  HomeIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { TransactionModal } from '../components/transaction/TransactionModal';
import { SavingForm } from '../components/saving/SavingForm';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { SummaryCards } from '../components/analytics/SummaryCards';
import { MonthlyTrendsChart } from '../components/analytics/MonthlyTrendsChart';
import { CategoryBreakdownChart } from '../components/analytics/CategoryBreakdownChart';
import { FinancialSuggestions } from '../components/analytics/FinancialSuggestions';
import { AnalyticsHeader } from '../components/analytics/AnalyticsHeader';
import { CardGroup } from '../components/analytics/CardGroup';
import { FloatingActionButton } from '../components/analytics/FloatingActionButton';
import { SavingsTypeMetricsCard } from '../components/analytics/SavingsTypeMetricsCard';
import { formatUSD } from '../utils/currencyUtils';

type TabType = 'overview' | 'transaction' | 'saving';

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}> = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
      active
        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm'
    }`}
  >
    <Icon className={`h-5 w-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
    <span className="font-medium">{label}</span>
  </button>
);

const SavingsSummary: React.FC<{
  credits: number;
  debits: number;
  creditCount: number;
  debitCount: number;
}> = ({ credits, debits, creditCount, debitCount }) => {
  const { t } = useTranslation();
  const netSavings = credits - debits;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('savings.total_credits')}</p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                {formatUSD(credits)}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
              <ArrowUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {creditCount} {t('savings.transactions')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('savings.total_debits')}</p>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                {formatUSD(debits)}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
              <ArrowDownIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {debitCount} {t('savings.transactions')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('savings.net_savings')}</p>
              <p className={`text-2xl font-semibold ${netSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatUSD(netSavings)}
              </p>
            </div>
            <div className={`p-2 rounded-full ${netSavings >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {netSavings >= 0 ? (
                <ArrowUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <ArrowDownIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {creditCount + debitCount} {t('savings.total_transactions')}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('savings.savings_rate')}</h4>
        <div className="flex items-center space-x-2">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 dark:bg-green-400 rounded-full"
              style={{ width: `${(credits / (credits + debits)) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {((credits / (credits + debits)) * 100).toFixed(1)}%
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t('savings.percentage_credits')}
        </p>
      </div>
    </div>
  );
};

export const AnalyticsScreen: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const {
    selectedYear,
    setSelectedYear,
    yearIncome,
    yearExpenses,
    yearSavings,
    netBalance,
    netSavings,
    monthlyBurnRate,
    monthlyData,
    expenseCategories,
    incomeCategories,
    suggestions,
    savingsSummary,
    filteredData,
    isLoading,
    error,
    isRefetching,
    refetchData
  } = useAnalytics();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showSavingForm, setShowSavingForm] = useState(false);

  const handleAddTransaction = () => {
    setShowTransactionModal(true);
  };

  const handleAddSaving = () => {
    setShowSavingForm(true);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <p className="text-red-500 font-medium mb-4">{error.message}</p>
            <button 
              onClick={refetchData}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderLoadingState = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner size="large" className="text-indigo-600 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 animate-pulse">Loading analytics...</p>
      </div>
    </div>
  );

  if (isLoading) {
    return renderLoadingState();
  }

  const renderOverviewTab = () => (
    <div className="space-y-8">
      <SummaryCards
        yearIncome={yearIncome}
        yearExpenses={yearExpenses}
        yearSavings={yearSavings}
        netBalance={netBalance}
        netSavings={netSavings}
        monthlyBurnRate={monthlyBurnRate}
      />

      <CardGroup 
        title="Monthly Analysis" 
        icon={ChartPieIcon}
        defaultExpanded={true}
        accentColor="from-purple-500 to-purple-600"
      >
        <MonthlyTrendsChart data={monthlyData} />
      </CardGroup>

      <CardGroup 
        title="Category Breakdown" 
        icon={WalletIcon}
        defaultExpanded={true}
        accentColor="from-green-500 to-green-600"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryBreakdownChart
            data={expenseCategories}
            title="Expense Categories"
          />
          <CategoryBreakdownChart
            data={incomeCategories}
            title="Income Categories"
          />
        </div>
      </CardGroup>

      <CardGroup 
        title="Financial Insights" 
        icon={ScaleIcon}
        defaultExpanded={true}
        accentColor="from-amber-500 to-amber-600"
      >
        <FinancialSuggestions suggestions={suggestions} />
      </CardGroup>
    </div>
  );

  const renderTransactionTab = () => (
    <div className="space-y-6 animate-fadeIn">
      <CardGroup 
        title="Transaction Summary" 
        icon={BanknotesIcon}
        defaultExpanded={true}
        accentColor="from-blue-500 to-indigo-500"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('transactions.total_income')}</p>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                  {formatUSD(yearIncome)}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                <ArrowUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('transactions.total_expenses')}</p>
                <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                  {formatUSD(yearExpenses)}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                <ArrowDownIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>
      </CardGroup>

      <CardGroup 
        title="Category Analysis" 
        icon={ChartPieIcon}
        defaultExpanded={true}
        accentColor="from-purple-500 to-purple-600"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryBreakdownChart
            data={expenseCategories}
            title="Expense Categories"
          />
          <CategoryBreakdownChart
            data={incomeCategories}
            title="Income Categories"
          />
        </div>
      </CardGroup>

      <CardGroup 
        title="Monthly Trends" 
        icon={PresentationChartLineIcon}
        defaultExpanded={true}
        accentColor="from-indigo-500 to-purple-500"
      >
        <MonthlyTrendsChart data={monthlyData} />
      </CardGroup>
    </div>
  );

  const renderSavingTab = () => (
    <div className="space-y-6 animate-fadeIn">
      <CardGroup
        title={t('savings.analysis')}
        icon={ScaleIcon}
        defaultExpanded={true}
        accentColor="from-green-500 to-emerald-500"
      >
        <SavingsSummary
          credits={savingsSummary.credits}
          debits={savingsSummary.debits}
          creditCount={savingsSummary.creditCount}
          debitCount={savingsSummary.debitCount}
        />
      </CardGroup>

      <CardGroup
        title={t('savings.type_metrics')}
        icon={PresentationChartLineIcon}
        defaultExpanded={true}
        accentColor="from-indigo-500 to-purple-500"
      >
        <SavingsTypeMetricsCard savings={filteredData.savings} />
      </CardGroup>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <AnalyticsHeader
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        isRefetching={isRefetching}
        onRefetch={refetchData}
      />

      <div className="mt-8">
        <div className="flex space-x-4 mb-6">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={HomeIcon}
            label={t('analytics.overview')}
          />
          <TabButton
            active={activeTab === 'transaction'}
            onClick={() => setActiveTab('transaction')}
            icon={BanknotesIcon}
            label={t('analytics.transactions')}
          />
          <TabButton
            active={activeTab === 'saving'}
            onClick={() => setActiveTab('saving')}
            icon={WalletIcon}
            label={t('analytics.savings')}
          />
        </div>

        <div className="space-y-6">
          {isRefetching && (
            <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
              <LoadingSpinner size="small" className="text-indigo-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Refreshing data...</span>
            </div>
          )}
          
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'transaction' && renderTransactionTab()}
          {activeTab === 'saving' && renderSavingTab()}
        </div>
      </div>

      <FloatingActionButton
        onAddTransaction={handleAddTransaction}
        onAddSaving={handleAddSaving}
      />

      {showTransactionModal && (
        <TransactionModal
          onClose={() => setShowTransactionModal(false)}
        />
      )}

      {showSavingForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <SavingForm
              onSubmit={async () => {
                await refetchData();
                setShowSavingForm(false);
              }}
              onCancel={() => setShowSavingForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
