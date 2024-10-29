// Next, React
import { FC, useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Components
import { RequestAirdrop } from '../../components/RequestAirdrop';
import pkg from '../../../package.json';

// Store
import useUserSOLBalanceStore from '../../stores/useUserSOLBalanceStore';

export const HomeView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();

  const balance = useUserSOLBalanceStore((s) => s.balance);
  const { getUserSOLBalance } = useUserSOLBalanceStore();

  const [ai16zBalance, setAi16zBalance] = useState<number | null>(null);
  const [blockData, setBlockData] = useState<any>(null);

  const ai16zTokenAddress = new PublicKey('HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC');

  useEffect(() => {
    if (wallet.publicKey) {
      console.log(wallet.publicKey.toBase58());
      getUserSOLBalance(wallet.publicKey, connection);
      fetchAi16zBalance();
      fetchBlockData();
    }
  }, [wallet.publicKey, connection, getUserSOLBalance]);

  const fetchAi16zBalance = async () => {
    if (!wallet.publicKey) return;

    try {
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });
      
      const ai16zAccount = tokenAccounts.value.find(
        (accountInfo) => accountInfo.account.data.parsed.info.mint === ai16zTokenAddress.toBase58()
      );

      const balance = ai16zAccount
        ? parseFloat(ai16zAccount.account.data.parsed.info.tokenAmount.uiAmountString)
        : 0;

      setAi16zBalance(balance);
    } catch (error) {
      console.error('Failed to fetch ai16z balance:', error);
      setAi16zBalance(null);
    }
  };

  const fetchBlockData = async () => {
    try {
      const response = await axios.post(process.env.NEXT_PUBLIC_SOLANA_API, {
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
        <h4 className="md:w-full text-2x1 md:text-4xl text-center text-slate-300 my-2">
          <p>Welcome to the Partners Lounge.</p>
          <p className='text-slate-500 text-2x1 leading-relaxed'></p>
        </h4>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-indigo-500 rounded-lg blur opacity-40 animate-tilt"></div>
        </div>
        <div className="flex flex-col mt-2">
         
          <h4 className="md:w-full text-2xl text-slate-300 my-2">
            {wallet && (
              <div className="flex flex-row justify-center">
                <div className='ml-4'>
                  {(ai16zBalance !== null) ? ai16zBalance.toLocaleString() : 'Loading...'} ai16z
                </div>
              </div>
            )}
          </h4>
          {blockData && (
            <div className='text-slate-400 text-center mt-4'>
              Block Height: {blockData.result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
