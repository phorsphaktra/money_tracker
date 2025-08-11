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
    className={`flex items-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg transition-all duration-200 min-h-[44px] touch-manipulation ${
      active
        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm'
    }`}
  >
    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
    <span className="font-medium text-sm">{label}</span>
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
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm mobile-card-hover mobile-transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{t('savings.total_credits')}</p>
              <p className="text-lg sm:text-xl md:text-2xl font-semibold text-green-600 dark:text-green-400">
                {formatUSD(credits)}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
              <ArrowUpIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {creditCount} {t('savings.transactions')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm mobile-card-hover mobile-transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{t('savings.total_debits')}</p>
              <p className="text-lg sm:text-xl md:text-2xl font-semibold text-red-600 dark:text-red-400">
                {formatUSD(debits)}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
              <ArrowDownIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {debitCount} {t('savings.transactions')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm mobile-card-hover mobile-transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{t('savings.net_savings')}</p>
              <p className={`text-lg sm:text-xl md:text-2xl font-semibold ${netSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatUSD(netSavings)}
              </p>
            </div>
            <div className={`p-2 rounded-full ${netSavings >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {netSavings >= 0 ? (
                <ArrowUpIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              ) : (
                <ArrowDownIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {creditCount + debitCount} {t('savings.total_transactions')}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm mobile-card-hover mobile-transition">
        <h4 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('savings.savings_rate')}</h4>
        <div className="flex items-center space-x-2">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 dark:bg-green-400 rounded-full"
              style={{ width: `${(credits / (credits + debits)) * 100}%` }}
            />
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
            {((credits / (credits + debits)) * 100).toFixed(1)}%
          </span>
        </div>
        <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-area-inset-top">
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <p className="text-red-500 font-medium mb-4 text-sm sm:text-base">{error.message}</p>
            <button 
              onClick={refetchData}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 min-h-[44px] touch-manipulation"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderLoadingState = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-area-inset-top">
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <LoadingSpinner size="large" className="text-indigo-600 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 animate-pulse text-center text-sm sm:text-base">Loading analytics...</p>
      </div>
    </div>
  );

  if (isLoading) {
    return renderLoadingState();
  }

  const renderOverviewTab = () => (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
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
        <div className="overflow-x-auto">
          <div className="min-w-[280px] sm:min-w-[320px]">
            <MonthlyTrendsChart data={monthlyData} />
          </div>
        </div>
      </CardGroup>

      <CardGroup 
        title="Category Breakdown" 
        icon={WalletIcon}
        defaultExpanded={true}
        accentColor="from-green-500 to-green-600"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="overflow-x-auto">
            <div className="min-w-[240px] sm:min-w-[280px]">
              <CategoryBreakdownChart
                data={expenseCategories}
                title="Expense Categories"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[240px] sm:min-w-[280px]">
              <CategoryBreakdownChart
                data={incomeCategories}
                title="Income Categories"
              />
            </div>
          </div>
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
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      <CardGroup 
        title="Transaction Summary" 
        icon={BanknotesIcon}
        defaultExpanded={true}
        accentColor="from-blue-500 to-indigo-500"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow duration-200 mobile-card-hover mobile-transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{t('transactions.total_income')}</p>
                <p className="text-lg sm:text-xl md:text-2xl font-semibold text-green-600 dark:text-green-400">
                  {formatUSD(yearIncome)}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                <ArrowUpIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow duration-200 mobile-card-hover mobile-transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{t('transactions.total_expenses')}</p>
                <p className="text-lg sm:text-xl md:text-2xl font-semibold text-red-600 dark:text-red-400">
                  {formatUSD(yearExpenses)}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                <ArrowDownIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="overflow-x-auto">
            <div className="min-w-[240px] sm:min-w-[280px]">
              <CategoryBreakdownChart
                data={expenseCategories}
                title="Expense Categories"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[240px] sm:min-w-[280px]">
              <CategoryBreakdownChart
                data={incomeCategories}
                title="Income Categories"
              />
            </div>
          </div>
        </div>
      </CardGroup>

      <CardGroup 
        title="Monthly Trends" 
        icon={PresentationChartLineIcon}
        defaultExpanded={true}
        accentColor="from-indigo-500 to-purple-500"
      >
        <div className="overflow-x-auto">
          <div className="min-w-[280px] sm:min-w-[320px]">
            <MonthlyTrendsChart data={monthlyData} />
          </div>
        </div>
      </CardGroup>
    </div>
  );

  const renderSavingTab = () => (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
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
        <div className="overflow-x-auto">
          <div className="min-w-[240px] sm:min-w-[320px]">
            <SavingsTypeMetricsCard savings={filteredData.savings} />
          </div>
        </div>
      </CardGroup>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-area-inset-top">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8 smooth-scroll">
        <AnalyticsHeader
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          isRefetching={isRefetching}
          onRefetch={refetchData}
        />

        <div className="mt-6 sm:mt-8">
          <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
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

          <div className="space-y-4 sm:space-y-6">
            {isRefetching && (
              <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 rounded-lg shadow-lg">
                <LoadingSpinner size="small" className="text-indigo-600" />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Refreshing data...</span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 mobile-modal-backdrop p-3 sm:p-4 overflow-y-auto safe-area-inset-top safe-area-inset-bottom">
            <div className="w-full max-w-[95vw] sm:max-w-lg mx-auto">
              <TransactionModal
                onClose={() => setShowTransactionModal(false)}
              />
            </div>
          </div>
        )}

        {showSavingForm && (
          <div className="fixed inset-0 bg-black/30 mobile-modal-backdrop z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto safe-area-inset-top safe-area-inset-bottom">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-[95vw] sm:max-w-md w-full p-4 sm:p-6 mx-auto">
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
    </div>
  );
};
