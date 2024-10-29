import { FC, useState, useEffect } from 'react';
import Image from 'next/image';
import { signIn, useSession } from 'next-auth/react';  // Ensure you have the necessary OAuth setup
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

export const Profile: FC = () => {
  const { data: session } = useSession();
  const { publicKey, connected } = useWallet();
  const [view, setView] = useState('profile');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [totalWorth, setTotalWorth] = useState<number>(0);
  const [newPartners, setNewPartners] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (connected && publicKey) {
      fetchPartnersData();
      if (view === 'holdings') {
        fetchTokenData();
      }
    }
  }, [connected, publicKey, view]);

  const fetchPartnersData = async () => {
    setLoading(true);
    setError('');
    try {
      // Replace with actual data fetching logic
    } catch (err) {
      console.error('Failed to fetch partners data:', err);
      setError('Unable to fetch partners data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTokenData = async () => {
    // Replace with actual token fetching logic
  };

  const walletAddress = publicKey ? publicKey.toBase58() : 'Wallet not connected';

  return (
    <div className="flex flex-col items-center p-4 w-full max-w-7xl mx-auto">
      <h1 className="text-3xl font-semibold text-center" style={{ fontFamily: 'SF Compact Rounded', color: '#333', fontWeight: 600, fontSize: '34px', lineHeight: '42px', marginBottom: '24px' }}>Profile</h1>
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <button onClick={() => setView('profile')} className={`px-4 py-2 rounded-l ${view === 'profile' ? 'bg-[#B5AD94]' : 'bg-[#E8E3D500]'} text-${view === 'profile' ? 'white' : '[#9B8D7D]'} w-full md:w-auto`} style={{ height: '38px', borderRadius: '14px 0 0 14px' }}>
          Profile
        </button>
        <button onClick={() => setView('holdings')} className={`px-4 py-2 rounded-r ${view === 'holdings' ? 'bg-[#B5AD94]' : 'bg-[#E8E3D500]'} text-${view === 'holdings' ? 'white' : '[#9B8D7D]'} w-full md:w-auto`} style={{ height: '38px', borderRadius: '0 14px 14px 0' }}>
          Holdings
        </button>
      </div>
      <div style={{ background: 'linear-gradient(180deg, #9C9584 0%, #736B55 100%)', color: '#FFFFFF', borderRadius: '12px', padding: '10px 20px', width: '100%', boxSizing: 'border-box' }}>
        <div className="flex flex-wrap justify-around text-center mb-4">
          <div>
            <div className="text-2xl font-bold">{view === 'profile' ? partners.length : tokens.length}</div>
            <div className="text-white">{view === 'profile' ? 'Trust Score' : 'Tokens'}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">${totalWorth.toFixed(2)}m</div>
            <div className="text-white">Total Worth</div>
          </div>
          <div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 font-semibold text-sm text-gray-500">
            <div>{view === 'profile' ? 'PARTNER' : 'TOKEN'}</div>
            <div className="text-center">{view === 'profile' ? 'TRUST SCORE' : 'AMOUNT'}</div>
            <div className="text-center">{view === 'profile' ? 'HOLDINGS' : 'UI AMOUNT'}</div>
          </div>

          {view === 'profile' ? partners.map((partner) => (
            <div key={partner.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4 border-b">
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
            <div key={token.mint} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4 border-b">
              <div className="text-center">{token.mint}</div>
              <div className="text-center">{token.amount}</div>
              <div className="text-center">{token.uiAmount}</div>
            </div>
          ))}
        </>
      )}

      <div>
        <button className="rounded-full bg-[#9B8D7D] text-white font-bold py-2 px-4 ml-2" onClick={() => signIn('twitter')}>Connect X</button>
        <button className="rounded-full bg-[#9B8D7D] text-white font-bold py-2 px-4" onClick={() => signIn('github')}>Connect GitHub</button>
        <button className="rounded-full bg-[#9B8D7D] text-white font-bold py-2 px-4 ml-2" onClick={() => signIn('linkedin')}>Connect LinkedIn</button>
      </div>
      <div className="my-4" style={{ background: '#9B8D7D', padding: '10px', borderRadius: '8px', marginTop: '8px' }}>
        <h2 className="font-bold text-lg">Wallet Address</h2>
        <p>{walletAddress}</p>
      </div>
    </div>
  );
};

export default Profile;
