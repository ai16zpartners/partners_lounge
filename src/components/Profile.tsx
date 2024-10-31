import React, { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Image from 'next/image';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Session } from 'next-auth';

interface Partner {
  id: string;
  name: string;
  avatar: string;
  trustScore: number;
  holdings: number;
}

interface Token {
  mint: string;
  amount: number;
  uiAmount: number;
  value?: number; // Add value field
}

interface SocialConnection { 
  platform: string;
  connected: boolean;
  profileImage?: string;
  username?: string;  // Changed from userName to username
}

interface SessionUser extends Session {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    connections?: {
      [key: string]: {
        username: string;
        image: string;
      };
    };
  };
}

interface SocialConnection {
  platform: string;
  connected: boolean;
  username?: string;
  profileImage?: string;
}

interface TokenHolding {
  mint: string;
  amount: number;
  decimals: number;
}

interface SessionUser {
  user?: {
    name?: string;
    email?: string;
    image?: string;
    connections?: {
      discord?: {
        name: string;
        image: string;
      };
      twitter?: {
        name: string;
        image: string;
      };
      github?: {
        name: string;
        image: string;
      };
    };
  };
}

export const Profile: FC = () => {
  const [view, setView] = useState('profile');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [totalWorth, setTotalWorth] = useState<number>(0);
  const [newPartners, setNewPartners] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { data: session } = useSession() as { data: SessionUser };
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([
    { platform: 'discord', connected: false },
    { platform: 'twitter', connected: false },
    { platform: 'github', connected: false },
  ]);
  const [trustScore, setTrustScore] = useState(0);
  const [userProfileImage, setUserProfileImage] = useState('');
  const [userName, setUserName] = useState('');
  const [tokenHoldings, setTokenHoldings] = useState<TokenHolding[]>([]);
  const wallet = useWallet();
  const walletAddress = wallet.publicKey?.toBase58() || 'No wallet connected';

  const HELIUS_URL = `https://mainnet.helius-rpc.com/${process.env.NEXT_PUBLIC_SOLANA_API}`;
  const TRACKED_TOKENS = [
    'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
    'Gu3LDkn7Vx3bmCzLafYNKcDxv2mH7YN44NJZFXnypump'
  ];

  useEffect(() => {
    if (session?.user?.connections) {
      const updatedConnections = socialConnections.map(conn => {
        const connectionData = session.user?.connections?.[conn.platform];
        return {
          ...conn,
          connected: !!connectionData,
          username: connectionData?.username || '',
          profileImage: connectionData?.image || ''
        };
      });
      setSocialConnections(updatedConnections);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      setIsSignedIn(true);
      // Update social connections based on session
      const updatedConnections = socialConnections.map(conn => ({
        ...conn,
        connected: !!session.user?.connections?.[conn.platform as keyof typeof session.user.connections],
        profileImage: session.user?.connections?.[conn.platform as keyof typeof session.user.connections]?.image,
        userName: session.user?.connections?.[conn.platform as keyof typeof session.user.connections]?.username
      }));
      setSocialConnections(updatedConnections);
      
      // Calculate trust score
      const walletPoints = wallet.connected ? 10 : 0;
      const socialPoints = updatedConnections.filter(conn => conn.connected).length * 30;
      setTrustScore(walletPoints + socialPoints);
    }
  }, [session, wallet.connected]);

  useEffect(() => {
    console.log('Session data:', session);
    if (session?.user?.connections) {
      console.log('Connections:', session.user.connections);
      const updatedConnections = socialConnections.map(conn => {
        const connectionData = session.user?.connections?.[conn.platform];
        console.log(`${conn.platform} data:`, connectionData);
        return {
          ...conn,
          connected: !!connectionData,
          username: connectionData?.name || '',
          profileImage: connectionData?.image || ''
        };
      });
      console.log('Updated connections:', updatedConnections);
      setSocialConnections(updatedConnections);
    }
  }, [session]);

  const fetchPartnersData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/partners');
      const data = await response.json();
      setPartners(data.partners);
      setTotalWorth(data.totalWorth);
      setNewPartners(data.newPartners);
    } catch (err) {
      setError('Failed to fetch partners data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTokenData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tokens');
      const data = await response.json();
      setTokens(data.tokens);
    } catch (err) {
      setError('Failed to fetch token data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTokenHoldings = async () => {
    if (!wallet.publicKey) return;
  
    try {
      const response = await fetch(HELIUS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'token-balances',
          method: 'getTokenBalances',
          params: [
            wallet.publicKey.toString()
          ]
        }),
      });
  
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Token data:', data); // Debug response
  
      if (data.result) {
        const relevantTokens = data.result
          .filter((token: any) => TRACKED_TOKENS.includes(token.mint))
          .map((token: any) => ({
            mint: token.mint,
            amount: token.amount,
            decimals: token.decimals
          }));
  
        setTokenHoldings(relevantTokens);
      }
    } catch (error) {
      console.error('Error fetching token holdings:', error);
    }
  };

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      fetchPartnersData();
      if (view === 'holdings') {
        fetchTokenData();
      }
    }
  }, [wallet, view]);

  useEffect(() => {
    if (wallet.connected) {
      fetchTokenHoldings();
    }
  }, [wallet.connected]);

    return (
    <div className="flex flex-col items-center p-4 w-full max-w-7xl mx-auto">
      <h1 className="text-3xl font-semibold" style={{ fontFamily: 'SF Compact Rounded', color: '#333', fontWeight: 600, fontSize: '34px', lineHeight: '42px', marginBottom: '24px' }}>Profile</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setView('profile')} className={`px-4 py-2 rounded-l ${view === 'profile' ? 'bg-[#B5AD94]' : 'bg-[#E8E3D5]'} text-${view === 'profile' ? 'white' : '[#9B8D7D]'} w-full md:w-auto`} style={{ height: '38px', borderRadius: '14px 0 0 14px' }}>
          Profile
        </button>
        <button onClick={() => setView('holdings')} className={`px-4 py-2 rounded-r ${view === 'holdings' ? 'bg-[#B5AD94]' : 'bg-[#E8E3D5]'} text-${view === 'holdings' ? 'white' : '[#9B8D7D]'} w-full md:w-auto`} style={{ height: '38px', borderRadius: '0 14px 14px 0' }}>
          Holdings
        </button>
      </div>

      <div style={{ background: 'linear-gradient(180deg, #9C9584 0%, #736B55 100%)', color: '#FFFFFF', borderRadius: '12px', padding: '10px 20px', width: '100%', boxSizing: 'border-box' }}>
  <div className="flex flex-wrap justify-around text-center mb-4">
    <div>
      <div className="text-2xl font-bold">{trustScore}</div>
      <div className="text-white">Trust Score</div>
    </div>
    <div>
      <div className="text-2xl font-bold">${totalWorth.toFixed(2)}</div>
      <div className="text-white">Total Worth</div>
    </div>
    <div>
      <div className="text-2xl font-bold">+{newPartners}</div>
      <div className="text-white">New Partners (7D)</div>
    </div>
  </div>
</div>

{/* Add Holdings Table */}
{view === 'holdings' && (
  <div className="w-full mt-6">
    <table className="w-full">
      <thead>
        <tr className="text-left">
          <th className="py-2 px-4 bg-[#E8E3D5] text-[#9B8D7D] text-left rounded-tl">HOLDING</th>
          <th className="py-2 px-4 bg-[#E8E3D5] text-[#9B8D7D] text-right">ALLOCATION</th>
          <th className="py-2 px-4 bg-[#E8E3D5] text-[#9B8D7D] text-right rounded-tr">VALUE</th>
        </tr>
      </thead>
      <tbody>
        {tokenHoldings.map((token) => (
          <tr key={token.mint} className="border-b border-[#E8E3D5]">
            <td className="py-4 px-4 text-left">
              <span className="font-mono">{token.mint.slice(0, 4)}...{token.mint.slice(-4)}</span>
            </td>
            <td className="py-4 px-4 text-right">
              {(token.amount / Math.pow(10, token.decimals)).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </td>
            <td className="py-4 px-4 text-right">
              ${token.value?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }) || '0.00'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}



  {view === 'profile' && (
    <div className="flex flex-col items-start w-full">
      <div className="w-full" style={{ padding: '24px', borderRadius: '12px', marginTop: '24px' }}>
        <h1 style={{ fontFamily: 'SF Compact Rounded', fontSize: '18px', fontWeight: 600, lineHeight: '24px', textAlign: 'left', color: '#000' }}>Socials</h1>
        <div className='flex flex-row flex-wrap gap-2 mt-4'>
          {socialConnections.map((connection) => {
            console.log('Rendering connection:', connection);
            return connection.connected ? (
              <button 
                key={connection.platform}
                className="rounded-full bg-[#F98C13] text-white font-bold py-2 px-4 flex items-center gap-2"
                onClick={() => signOut()}
              >
                {connection.profileImage && (
                  <Image 
                    src={connection.profileImage}
                    alt={connection.username || ''}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <span>{connection.username}</span>
              </button>
            ) : (
              <button 
                key={connection.platform}
                className="rounded-full bg-[#9B8D7D] text-white font-bold py-2 px-4"
                onClick={() => signIn(connection.platform)}
              >
                Connect {connection.platform.charAt(0).toUpperCase() + connection.platform.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full mt-6">
        <h1 style={{ fontFamily: 'SF Compact Rounded', fontSize: '18px', fontWeight: 600, lineHeight: '24px', textAlign: 'left', color: '#242424' }}>Wallets</h1>
        <div className="mt-4" style={{ background: '#9B8D7D', padding: '16px', borderRadius: '8px' }}>
          <h2 className="font-bold text-lg text-white">Wallet Address</h2>
          <p className="text-white mt-2">{walletAddress}</p>
          
          {/* Add Token Holdings */}
          <div className="mt-4">
            <div className="space-y-2 mt-2">
              {tokenHoldings.map((token) => (
                <div key={token.mint} className="text-white flex justify-between items-center">
                  <span className="font-mono">
                    {token.mint.slice(0, 4)}...{token.mint.slice(-4)}
                  </span>
                  <span>
                    {(token.amount / Math.pow(10, token.decimals)).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
    </div>
  );
};

export default Profile;