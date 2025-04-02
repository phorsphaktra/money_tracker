const transactions = [
  { id: 1, name: 'Grocery Shopping', amount: -120.50, date: '2024-01-15', category: 'Food' },
  { id: 2, name: 'Salary Deposit', amount: 3000.00, date: '2024-01-14', category: 'Income' },
  { id: 3, name: 'Netflix Subscription', amount: -15.99, date: '2024-01-13', category: 'Entertainment' },
  { id: 4, name: 'Gas Station', amount: -45.00, date: '2024-01-12', category: 'Transport' },
];

export const TransactionsList = () => {
  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <span className={`text-sm font-medium ${
                  transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.category[0]}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{transaction.name}</p>
              <p className="text-sm text-gray-500">{transaction.date}</p>
            </div>
          </div>
          <span className={`text-sm font-medium ${
            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
};
