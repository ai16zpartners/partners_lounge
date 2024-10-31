import React, { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Image from 'next/image';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Session } from 'next-auth';

// Interfaces
interface Partner {
  id: string;
  name: string;
  avatar: string;
  trustScore: number;
  holdings: number;
}

interface TokenInfo {
  name: string;
  totalSupply: number;
  imageUrl: string;
  cgId: string;
}

interface TokenHolding {
  mint: string;
  name: string;
  imageUrl: string;
  amount: bigint;
  decimals: number;
  totalSupply: number;
  uiAmount: number;
  value: number;
  price: number;
  allocationPercentage: number;
  displayAmount: string;
}

interface SocialConnection {
  platform: string;
  connected: boolean;
  profileImage?: string;
  name?: string;
}

interface SessionUser extends Session {
  user: {
    name?: string;
    email?: string;
    image?: string;
    connections?: {
      [provider: string]: {
        name: string;
        image: string;
      };
    };
  };
}

const TRACKED_TOKENS = [
  'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
  'Gu3LDkn7Vx3bmCzLafYNKcDxv2mH7YN44NJZFXnypump'
];

// Add token information
const TOKEN_INFO: { [mint: string]: TokenInfo } = {
  'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC': {
    name: 'ai16z',
    totalSupply: 109999988538,
    imageUrl: './ai16z.png',
    cgId: 'ai16z'
  },
  'Gu3LDkn7Vx3bmCzLafYNKcDxv2mH7YN44NJZFXnypump': {
    name: 'degenai',
    totalSupply: 999994441.36,
    imageUrl: './degenai.png',
    cgId: 'degenai'
  }
};

export const Profile: FC = () => {
  // State
  const [tokenPrices, setTokenPrices] = useState<{ [mint: string]: number }>({});
  const [view, setView] = useState<'profile' | 'holdings'>('profile');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [totalWorth, setTotalWorth] = useState<number>(0);
  const [newPartners, setNewPartners] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([
    { platform: 'discord', connected: false },
    { platform: 'twitter', connected: false },
    { platform: 'github', connected: false },
  ]);
  const [trustScore, setTrustScore] = useState(0);
  const [tokenHoldings, setTokenHoldings] = useState<TokenHolding[]>([]);

  // Hooks
  const { data: sessionData } = useSession();
  const session = sessionData as SessionUser;
  const wallet = useWallet();
  const walletAddress = wallet.publicKey?.toBase58() || 'No wallet connected';

  const fetchTokenHoldings = async () => {
    if (!wallet.publicKey) {
      console.log('No wallet connected');
      return;
    }
  
    const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_SOLANA_API}`;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: wallet.publicKey.toString()
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
  
      const data = await response.json();
      console.log('Token data response:', data);
  
      if (data.tokens) {
        // Update prices state
        setTokenPrices(data.prices || {});
  
        const processedTokens = data.tokens
          .map((token: any) => {
            try {
              const tokenInfo = TOKEN_INFO[token.mint];
              if (!tokenInfo) return null;
  
              const amount = BigInt(token.amount);
              const decimals = token.decimals;
              const uiAmount = Number(amount) / Math.pow(10, decimals);
              const price = data.prices[token.mint] || 0;
              const value = uiAmount * price;
  
              return {
                mint: token.mint,
                name: tokenInfo.name,
                imageUrl: tokenInfo.imageUrl,
                amount,
                decimals,
                totalSupply: tokenInfo.totalSupply,
                uiAmount,
                price,
                value,
                allocationPercentage: (uiAmount / tokenInfo.totalSupply * 100),
                displayAmount: uiAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })
              };
            } catch (err) {
              console.error('Error processing token:', err);
              return null;
            }
          })
          .filter((token): token is TokenHolding => token !== null);
  
        setTokenHoldings(processedTokens);
        
        // Update total worth
        const total = processedTokens.reduce((sum, token) => sum + token.value, 0);
        setTotalWorth(total);
      }
    } catch (error) {
      console.error('Token fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch tokens');
      setTokenHoldings([]);
      setTotalWorth(0);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPartnersData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/partners');
      
      if (!response.ok) {
        throw new Error(`Partners API error: ${response.status}`);
      }
  
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
  
      setPartners(data.partners);
      setNewPartners(data.newPartners);
      setError('');
    } catch (err) {
      console.error('Partners fetch error:', err);
      setError('Failed to fetch partners data');
      setPartners([]);
      setNewPartners(0);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    if (session?.user?.connections) {
      const updatedConnections = socialConnections.map(conn => {
        const connectionData = session.user.connections?.[conn.platform];
        return {
          ...conn,
          connected: !!connectionData,
          name: connectionData?.name || '',
          profileImage: connectionData?.image || ''
        };
      });
      setSocialConnections(updatedConnections);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      setIsSignedIn(true);
      const updatedConnections = socialConnections.map(conn => ({
        ...conn,
        connected: !!session.user?.connections?.[conn.platform],
        profileImage: session.user?.connections?.[conn.platform]?.image,
        name: session.user?.connections?.[conn.platform]?.name
      }));
      setSocialConnections(updatedConnections);
      
      const walletPoints = wallet.connected ? 10 : 0;
      const socialPoints = updatedConnections.filter(conn => conn.connected).length * 30;
      setTrustScore(walletPoints + socialPoints);
    }
  }, [session, wallet.connected]);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      fetchPartnersData();
      fetchTokenHoldings();
    }
  }, [wallet.connected, wallet.publicKey]);

  useEffect(() => {
    const total = tokenHoldings.reduce((sum, token) => sum + (token.value || 0), 0);
    setTotalWorth(total);
  }, [tokenHoldings]);

  const renderHoldingsTable = () => (
    <div className="w-full mt-6">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="py-2 px-4 bg-[#E8E3D5] !text-black font-bold text-left rounded-tl">HOLDINGS</th>
            <th className="py-2 px-4 bg-[#E8E3D5] !text-black font-bold text-right">ALLOCATION</th>
            <th className="py-2 px-4 bg-[#E8E3D5] !text-black font-bold text-right">PRICE</th>
            <th className="py-2 px-4 bg-[#E8E3D5] !text-black font-bold text-right rounded-tr">VALUE</th>
          </tr>
        </thead>
        <tbody className="!text-black">
          {tokenHoldings.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-8">
                <div className="!text-black">
                  <p className="mb-2">No token holdings found</p>
                  {wallet.connected ? (
                    <p className="text-sm">Make sure you have tokens in your wallet</p>
                  ) : (
                    <p className="text-sm">Connect your wallet to view holdings</p>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            tokenHoldings.map((token) => (
              <tr key={token.mint} className="border-b border-[#E8E3D5] hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-[#E8E3D5]">
                      {token.imageUrl && (
                        <Image
                          src={token.imageUrl}
                          alt={token.name}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold !text-black">
                        {token.name}
                      </span>
                      <span className="text-sm !text-black">
                        {token.displayAmount} tokens
                      </span>
                      <span className="text-xs !text-black opacity-60">
                        {token.mint.slice(0, 4)}...{token.mint.slice(-4)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-right !text-black font-medium">
                  {token.allocationPercentage.toFixed(1)}%
                </td>
                <td className="py-4 px-4 text-right !text-black font-medium">
                  ${token.price.toFixed(4)}
                </td>
                <td className="py-4 px-4 text-right !text-black font-medium">
                  ${token.value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderProfile = () => (
    <div className="flex flex-col items-start w-full">
      <div className="w-full" style={{ padding: '24px', borderRadius: '12px', marginTop: '24px' }}>
        <h1 style={{ fontFamily: 'SF Compact Rounded', fontSize: '18px', fontWeight: 600, lineHeight: '24px', textAlign: 'left', color: '#000' }}>Socials</h1>
        <div className='flex flex-row flex-wrap gap-2 mt-4'>
          {socialConnections.map((connection) => (
            connection.connected ? (
              <button 
                key={connection.platform}
                className="rounded-full bg-[#F98C13] text-white font-bold py-2 px-4 flex items-center gap-2"
                onClick={() => signOut()}
              >
                {connection.profileImage && (
                  <Image 
                    src={connection.profileImage}
                    alt={connection.name || ''}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <span>{connection.name}</span>
              </button>
            ) : (
              <button 
                key={connection.platform}
                className="rounded-full bg-[#9B8D7D] text-white font-bold py-2 px-4"
                onClick={() => signIn(connection.platform)}
              >
                Connect {connection.platform.charAt(0).toUpperCase() + connection.platform.slice(1)}
              </button>
            )
          ))}
        </div>
      </div>

      <div className="w-full mt-6">
       <h1 style={{ fontFamily: 'SF Compact Rounded', fontSize: '18px', fontWeight: 600, lineHeight: '24px', textAlign: 'left', color: '#242424' }}>Wallets</h1>
        <div className="mt-4" style={{ background: '#9B8D7D', padding: '16px', borderRadius: '8px' }}>
          <h2 className="font-bold text-lg text-white">Wallet Address</h2>
          <p className="text-white mt-2">{walletAddress}</p>
          
          <div className="mt-4">
            <div className="space-y-2 mt-2">
              {tokenHoldings.map((token) => (
                <div key={token.mint} className="text-white flex justify-between items-center">
                  <span className="font-mono">
                    {token.mint.slice(0, 4)}...{token.mint.slice(-4)}
                  </span>
                  <span>{token.displayAmount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="flex flex-col items-center p-4 w-full max-w-7xl mx-auto">
      <h1 className="text-3xl font-semibold" style={{ fontFamily: 'SF Compact Rounded', color: '#333', fontWeight: 600, fontSize: '34px', lineHeight: '42px', marginBottom: '24px' }}>Profile</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <button 
          onClick={() => setView('profile')} 
          className={`px-4 py-2 rounded-l ${view === 'profile' ? 'bg-[#B5AD94]' : 'bg-[#E8E3D5]'} text-${view === 'profile' ? 'white' : '[#9B8D7D]'} w-full md:w-auto`}
          style={{ height: '38px', borderRadius: '14px 0 0 14px' }}
        >
          Profile
        </button>
        <button 
          onClick={() => setView('holdings')} 
          className={`px-4 py-2 rounded-r ${view === 'holdings' ? 'bg-[#B5AD94]' : 'bg-[#E8E3D5]'} text-${view === 'holdings' ? 'white' : '[#9B8D7D]'} w-full md:w-auto`}
          style={{ height: '38px', borderRadius: '0 14px 14px 0' }}
        >
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

      {/* Enhanced view rendering with loading and error states */}
      {view === 'holdings' ? (
        <div className="w-full mt-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">
                <div className="h-6 bg-[#E8E3D5] rounded w-48 mx-auto mb-4"></div>
                <div className="h-4 bg-[#E8E3D5] rounded w-32 mx-auto"></div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
                <button 
                  onClick={() => {
                    setError('');
                    fetchTokenHoldings();
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="py-2 px-4 bg-[#E8E3D5] text-[#9B8D7D] text-left rounded-tl">HOLDING</th>
                  <th className="py-2 px-4 bg-[#E8E3D5] text-[#9B8D7D] text-right">ALLOCATION</th>
                  <th className="py-2 px-4 bg-[#E8E3D5] text-[#9B8D7D] text-right rounded-tr">VALUE</th>
                </tr>
              </thead>
              <tbody>
                {tokenHoldings.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-[#9B8D7D] py-8">
                      <div className="text-[#000]">
                        <p className="mb-2">No token holdings found</p>
                        {wallet.connected ? (
                          <p className="text-sm text-[#9B8D7D] ">Make sure you have tokens in your wallet</p>
                        ) : (
                          <p className="text-sm">Connect your wallet to view holdings</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  tokenHoldings.map((token) => (
                    <tr key={token.mint} className="border-b border-[#E8E3D5] hover:bg-gray-50">
                      <td className="py-4 px-4 text-left">
                        <div className="flex items-center">
                          <span className="font-mono text-sm">
                            {token.mint.slice(0, 4)}...{token.mint.slice(-4)}
                          </span>
                          <button 
                            onClick={() => navigator.clipboard.writeText(token.mint)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                            title="Copy address"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-4 w-4" 
                              viewBox="0 0 20 20" 
                              fill="currentColor"
                            >
                              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-mono">{token.displayAmount}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-mono">
                          ${token.value?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }) || '0.00'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      ) : renderProfile()}
    </div>
  );
};

export default Profile;