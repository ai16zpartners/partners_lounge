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

export const LeaderBoard: FC = () => {
  const [view, setView] = useState('partners'); // 'partners' or 'holdings'
  const [partners, setPartners] = useState<Partner[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [totalWorth, setTotalWorth] = useState<number>(0);
  const [newPartners, setNewPartners] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const wallet = useWallet();

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      fetchPartnersData();
      if (view === 'holdings') {
        fetchTokenData();
      }
    }
  }, [wallet.connected, wallet.publicKey, view]);

  const fetchPartnersData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(process.env.NEXT_PUBLIC_SOLANA_API, {
        jsonrpc: '2.0',
        id: 1,
        method: 'getProgramAccounts',
        params: [
          'YourProgramIDHere', // Update this ID with your program ID
          {
            encoding: 'jsonParsed',
            filters: [
              {
                memcmp: {
                  offset: 0,
                  bytes: wallet.publicKey.toBase58(),
                },
              },
            ],
          },
        ],
      });

      const fetchedPartners = response.data.result.map((partnerData: any, index: number) => ({
        id: index + 1,
        name: partnerData.account.data.parsed.info.name || `Partner ${index + 1}`,
        trustScore: parseFloat((Math.random() * 50).toFixed(1)),
        holdings: parseFloat((Math.random() * 50).toFixed(2)),
        avatar: partnerData.account.data.parsed.info.avatar || '/default-avatar.png',
      }));

      setPartners(fetchedPartners);
      setTotalWorth(fetchedPartners.reduce((total, partner) => total + partner.holdings, 0));
      setNewPartners(fetchedPartners.length);
    } catch (err) {
      console.error('Failed to fetch partners data:', err);
      setError('Unable to fetch partners data. Please try again later.');
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

  return (
    <div className="flex flex-col items-center p-4 mx-auto max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold" style={{ fontFamily: 'SF Compact Rounded', color: 'black', fontWeight: 600, fontSize: '34px', lineHeight: '42px', marginBottom: '24px' }}>Leaderboard</h1>
      </div>
      <div className="flex mb-4">
        <button onClick={() => setView('partners')} className={`px-4 py-2 ${view === 'partners' ? 'bg-gray-300' : 'bg-gray-100'} text-black rounded-l`}>
          Partners
        </button>
        <button onClick={() => setView('holdings')} className={`px-4 py-2 ${view === 'holdings' ? 'bg-gray-300' : 'bg-gray-100'} text-black rounded-r`}>
          Holdings
        </button>
      </div>
      <div style={{
        background: 'linear-gradient(180deg, #F98C13 0%, #FFAF03 100%)',
        color: '#FFFFFF',
        borderRadius: '12px',
        padding: '10px 20px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div className="flex py-4 mb-4 border-b">
          <div className="text-center">
            <div className="text-2xl font-bold">{view === 'partners' ? partners.length : tokens.length}</div>
            <div className="text-white">{view === 'partners' ? 'Partners' : 'Tokens'}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">${totalWorth.toFixed(2)}m</div>
            <div className="text-white">Total Worth</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">+{newPartners}</div>
            <div className="text-white">New Partners (7D)</div>
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
            <div className="text-center">{view === 'partners' ? 'HOLDINGS' : 'UI AMOUNT'}</div>
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
    </div>
  );
};

export default LeaderBoard;
