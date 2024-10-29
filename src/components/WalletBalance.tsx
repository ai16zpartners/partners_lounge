import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WalletBalance = ({ wallet }) => {
  const [balance, setBalance] = useState(null);
  const [ai16zBalance, setAi16zBalance] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await axios.post('https://api.mainnet-beta.solana.com/', {
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [wallet]
        });
        setBalance(response.data.result.value);
      } catch (err) {
        setError('Failed to fetch balance. Please try again later.');
        console.error('Error getting balance:', err);
      }
    };

    if (wallet) {
      fetchBalance();
    }
  }, [wallet]);

  const fetchBlockData = async () => {
    try {
      const response = await axios.post(process.env.LOCAL_SOLANA_API, {
        jsonrpc: "2.0",
        id: 1,
        method: "getBlockHeight",
      });
      setBlockData(response.data);
    } catch (error) {
      console.error('Failed to fetch block data:', error);
    }
  };

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <div className='mt-6'>
          <div className='text-sm font-normal align-bottom text-right text-slate-600 mt-4'>v{pkg.version}</div>
          <h1 className="text-center text-5xl md:pl-12 font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
            ai16z
          </h1>
        </div>
        {wallet && (
          <div className="flex flex-row justify-center">
            <div>
              {(balance || 0).toLocaleString()} SOL
            </div>
            <div className='text-slate-600 ml-2'>ai16z</div>
            <div className='ml-4'>
              {(ai16zBalance !== null) ? ai16zBalance.toLocaleString() : 'Loading...'} ai16z
            </div>
          </div>
        )}
        {error && <div className="text-red-500">{error}</div>}
      </div>
    </div>
  );
};

export default WalletBalance;