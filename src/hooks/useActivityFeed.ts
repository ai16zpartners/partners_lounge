// hooks/useActivityFeed.ts
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface Activity {
  id: string;
  type: 'transaction' | 'mint' | 'transfer';
  timestamp: number;
  amount?: number;
  from?: string;
  to?: string;
  status: 'success' | 'pending' | 'failed';
}

export const useActivityFeed = (limit = 10) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const wallet = useWallet();

  const loadMore = async () => {
    // Pagination logic here
  };

  useEffect(() => {
    loadMore();
  }, [wallet.publicKey]);

  return { activities, isLoading, hasMore, loadMore };
};