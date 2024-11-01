import { FC, useState, useEffect } from 'react';
import Image from 'next/image';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';

interface Partner {
  id: number;
  name: string;
  trustScore: number;
  holdings: number;
  avatar: string;
}

interface Token {
  mint: string;
  amount: number;
  uiAmount: number;
}

interface TokenHolderResponse {
  owner: string;
  amount: number;
  percentage: number;
}

export const LeaderBoard: FC = () => {
  const [view, setView] = useState('partners'); // 'partners' or 'holdings'
  const [partners, setPartners] = useState<Partner[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [totalWorth, setTotalWorth] = useState<number>(0);
  const [newPartners, setNewPartners] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [holders, setHolders] = useState<TokenHolderResponse[]>([]);
  const wallet = useWallet();

  const fetchPartnersData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/partners');
      
      if (!response.ok) {
        throw new Error(`Partners API error: ${response.status}`);
      }

      const data = await response.json();
      setPartners(data.partners);
      setNewPartners(data.newPartners);
      setTotalWorth(data.totalWorth);
      setError('');
    } catch (err) {
      console.error('Failed to fetch partners data:', err);
      setError('Failed to fetch partners data');
      setPartners([]);
      setNewPartners(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchTokenData = async () => {
    // Implement the logic to fetch SPL tokens
    // Assuming an API exists to fetch tokens by wallet address
    // Replace 'TokenAPIUrl' with your actual API endpoint
    const tokenAPIUrl = `https://api.solana.com`;
    try {
      const response = await axios.get(`${tokenAPIUrl}/get-tokens?walletAddress=${wallet.publicKey.toBase58()}`);
      const fetchedTokens = response.data.tokens.map((token: any) => ({
        mint: token.mint,
        amount: token.amount,
        uiAmount: token.uiAmount
      }));
      setTokens(fetchedTokens);
    } catch (error) {
      console.error('Failed to fetch tokens data:', error);
      setError('Unable to fetch tokens data. Please try again later.');
    }
  };

  const fetchHolders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/getAccounts');
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch holders: ${errorText}`);
      }

      const data = await response.json();
      setHolders(data.holders);
      setError('');
    } catch (err) {
      console.error('Failed to fetch holders:', err);
      setError('Failed to fetch holders data');
      setHolders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      fetchPartnersData();
    }
  }, [wallet.connected, wallet.publicKey]);

  useEffect(() => {
    if (view === 'holdings') {
      fetchHolders();
    }
  }, [view]);

  // Update useEffect to fetch holders for Partners view
  useEffect(() => {
    if (view === 'partners') {
      fetchHolders();
    }
  }, [view]);

  return (
    <div className="flex flex-col items-center p-4 w-full max-w-7xl mx-auto">
      <div className='w-full'>
      <h1 className="text-3xl font-semibold sf-font" style={{ fontFamily: 'SF Compact Rounded', color: '#333', fontWeight: 600, fontSize: '34px', lineHeight: '42px', marginBottom: '24px' }}>Leaderboard</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setView('partners')} className={`px-4 py-2 rounded-l ${view === 'partners' ? 'bg-[#B5AD94]' : 'bg-[#E8E3D5]'} text-${view === 'partners' ? 'white' : '[#9B8D7D]'} w-full md:w-auto`} style={{ height: '38px', borderRadius: '14px 0 0 14px' }}>
          Partners
        </button>
        <button onClick={() => setView('holdings')} className={`px-4 py-2 rounded-r ${view === 'holdings' ? 'bg-[#B5AD94]' : 'bg-[#E8E3D5]'} text-${view === 'holdings' ? 'white' : '[#9B8D7D]'} w-full md:w-auto`} style={{ height: '38px', borderRadius: '0 14px 14px 0' }}>
          Holdings
        </button>
      </div>
      </div>
      <div style={{
        background: 'linear-gradient(180deg, #F98C13 0%, #FFAF03 100%)',
        color: '#FFFFFF',
        borderRadius: '12px',
        padding: '10px 20px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div className="flex py-4 mb-4 border-b justify-around">
          <div className="text-center mx-4">
            <div className="text-2xl font-bold">{view === 'partners' ? holders.length : tokens.length}</div>
            <div className="text-white">{view === 'partners' ? 'PARTNERS' : 'MARKET CAP'}</div>
          </div>
          <div className="text-center mx-4">
            <div className="text-2xl font-bold">${totalWorth.toFixed(2)}m</div>
            <div className="text-white">{view === 'partners' ? 'TOTAL WORTH' : 'AUM'}</div>
          </div>
          <div className="text-center mx-4">
            <div className="text-2xl font-bold">+{newPartners}</div>
            <div className="text-white">NEW PARTNERS (7D)</div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center text-gray-500">Loading...</div>
      )}

      {error && (
        <div className="text-center text-red-500 mb-4">{error}</div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-3 gap-4 py-4 font-semibold text-sm text-gray-500">
            <div>{view === 'partners' ? 'PARTNER' : 'TOKEN'}</div>
            <div className="text-center">{view === 'partners' ? 'TRUST SCORE' : 'AMOUNT'}</div>
            <div className="text-center">{view === 'partners' ? 'HOLDINGS' : 'VALUE'}</div>
          </div>

          {view === 'partners' ? partners.map((partner) => (
            <div key={partner.id} className="grid grid-cols-3 gap-4 items-center py-4 border-b">
              <div className="flex items-center">
                <Image src={partner.avatar} alt={partner.name} width={40} height={40} className="rounded-full" onError={(e: any) => {
                  e.target.onerror = null;
                  e.target.src = '/default-avatar.png';
                }} />
                <span className="ml-4 font-semibold">{partner.name}</span>
              </div>
              <div className="text-center">{partner.trustScore}</div>
              <div className="text-center">{partner.holdings}</div>
            </div>
          )) : tokens.map((token) => (
            <div key={token.mint} className="grid grid-cols-3 gap-4 items-center py-4 border-b">
              <div className="text-center">{token.mint}</div>
              <div className="text-center">{token.amount}</div>
              <div className="text-center">{token.uiAmount}</div>
            </div>
          ))}
        </>
      )}
      {!loading && !error && view === 'partners' && (
        <div className="w-full mt-6">
          <table className="w-full">
            <thead>
              <tr>
                <th className="py-2 px-4 bg-[#E8E3D5] text-[#9B8D7D] text-left rounded-tl">PARTNER</th>
                <th className="py-2 px-4 bg-[#E8E3D5] text-[#9B8D7D] text-right">TRUST SCORE</th>
                <th className="py-2 px-4 bg-[#E8E3D5] text-[#9B8D7D] text-right rounded-tr">HOLDINGS</th>
              </tr>
            </thead>
            <tbody>
              {holders.map((holder) => (
                <tr key={holder.owner} className="border-b border-[#E8E3D5] hover:bg-gray-50">
                  <td className="py-4 px-4 text-left">{holder.owner.slice(0, 4)}...{holder.owner.slice(-4)}</td>
                  <td className="py-4 px-4 text-right">{holder.amount.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right">{holder.percentage.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && !error && view === 'holdings' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">Wallet</th>
                  <th className="text-right p-2">Amount</th>
                  <th className="text-right p-2">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {holders.map((holder) => (
                  <tr key={holder.owner}>
                    <td className="p-2">{holder.owner.slice(0, 4)}...{holder.owner.slice(-4)}</td>
                    <td className="text-right p-2">{holder.amount.toLocaleString()}</td>
                    <td className="text-right p-2">{holder.percentage.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
};

export default LeaderBoard;
