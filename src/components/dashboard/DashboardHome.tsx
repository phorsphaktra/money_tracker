import { CardStats } from '../CardStats';
import { TransactionsList } from '../transaction/TransactionsList';
import { SpendingChart } from '../SpendingChart';

export const DashboardHome = () => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardStats
          title="Total Balance"
          value="$12,750.90"
          trend="+2.5%"
          isPositive={true}
        />
        <CardStats
          title="Monthly Spending"
          value="$2,340.00"
          trend="-4.3%"
          isPositive={false}
        />
        <CardStats
          title="Monthly Income"
          value="$4,050.00"
          trend="+12.3%"
          isPositive={true}
        />
        <CardStats
          title="Savings Rate"
          value="42%"
          trend="+5.2%"
          isPositive={true}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Spending Overview
          </h3>
          <SpendingChart transactions={[]} />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Transactions
          </h3>
          <TransactionsList transactions={[]} />
        </div>
      </div>
    </div>
  );
};
