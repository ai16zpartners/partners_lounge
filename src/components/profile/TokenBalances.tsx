// components/profile/TokenBalances.tsx
import { FC } from 'react';
import { useTokenBalances } from '../../hooks/useTokenBalances';

export const TokenBalances: FC = () => {
  const { balances, isLoading } = useTokenBalances();

  return (
    <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">Token Holdings</h3>
      
      {isLoading ? (
        <div className="animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded mb-2"/>
          ))}
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="pb-2">Token</th>
              <th className="pb-2">Balance</th>
              <th className="pb-2 text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {balances.map((token) => (
              <tr key={token.mint} className="border-b">
                <td className="py-4">{token.symbol}</td>
                <td>{token.amount}</td>
                <td className="text-right">${token.value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};