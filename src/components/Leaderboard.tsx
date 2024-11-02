import { FC, useState, useEffect } from 'react';
import Image from 'next/image';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { getTokenPrice } from '../pages/api/tokens';

interface Partner {
  id: number;
  name: string;
  trustScore: number;
  holdings: number;
  avatar: string;
  nav: number;  // Add nav property
}

// Update Token interface
interface Token {
  mint: string;
  amount: number;
  uiAmount: number;
  value: number; // Add value property
  symbol: string; // Add symbol property
}

interface TokenHolderResponse {
  owner: string;
  amount: number;
  percentage: number;
  trustScore?: number; // Make optional
  nav?: number; // Make optional
}

// Add proper interface for assets
interface AssetBalance {
  mint: string;
  symbol: string;
  amount: number;
  price: number;
  value: number;
}

// Add new interfaces
interface DaoHolding {
  symbol: string;
  amount: number;
  price: number;
  value: number;
}

interface DaoHoldingsResponse {
  address: string;
  balances: DaoHolding[];
  totalValue: number;
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
  const [totalNav, setTotalNav] = useState(0);
  const [tokenPrice, setTokenPrice] = useState(0);
  const [priceError, setPriceError] = useState(false);
  const wallet = useWallet();
  // Update state with proper typing
  const [walletAssets, setWalletAssets] = useState<AssetBalance[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [daoHoldings, setDaoHoldings] = useState<DaoHolding[]>([]);
  const [daoTotalValue, setDaoTotalValue] = useState(0);
  const [daoLoading, setDaoLoading] = useState(false);

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

  // Update fetchWalletAssets function
  const fetchWalletAssets = async () => {
    if (!wallet.publicKey) {
      setError('Please connect your wallet');
      return;
    }
  
    setAssetsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/daoHoldings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          address: 'AM84n1iLdxgVTAyENBcLdjXoyvjentTbu5Q6EpKV1PeG' // DAO wallet address
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch assets');
      }
  
      const data = await response.json();
      setWalletAssets(data.balances);
      setTotalWorth(data.totalValue);
    } catch (error) {
      console.error('Asset fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load assets');
    } finally {
      setAssetsLoading(false);
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

  useEffect(() => {
    const fetchPrice = async () => {
      const price = await getTokenPrice('HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC');
      setTokenPrice(price);
    };
    fetchPrice();
  }, []);

  useEffect(() => {
    const calculateTotalNav = () => {
      const sum = partners.reduce((total, partner) => {
        return total + (partner.holdings * tokenPrice || 0);  // Calculate NAV from holdings
      }, 0);
      
      setTotalNav(sum);
    };

    if (partners.length > 0) {
      calculateTotalNav();
    }
  }, [partners]);

  const fetchDaoHoldings = async () => {
    try {
      setDaoLoading(true);
      const response = await fetch('/api/daoHoldings');
      if (!response.ok) throw new Error('Failed to fetch DAO holdings');
      const data: DaoHoldingsResponse = await response.json();
      setDaoHoldings(data.balances);
      setDaoTotalValue(data.totalValue);
    } catch (error) {
      console.error('Error fetching DAO holdings:', error);
    } finally {
      setDaoLoading(false);
    }
  };

  useEffect(() => {
    fetchDaoHoldings();
  }, []);

  const calculateTotalWorth = (amount: number) => {
    return (amount * tokenPrice).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  // Formatting functions
  const formatAmount = (amount: number): string => {
    // Convert from 9 decimal places to human readable
    const convertedAmount = amount / 1e9;
    return convertedAmount.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };
  
  const formatPrice = (price: number): string => {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  const formatValue = (amount: number, price: number): string => {
    // Convert amount before calculating value
    const convertedAmount = amount / 1e9;
    return (convertedAmount * price).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  const DaoHoldingsTable = () => (
    <div className="w-full px-4">
      {daoLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="w-full">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-[#E8E3D5]">
                <th className="py-4 px-4 text-left text-black w-1/4">Token</th>
                <th className="py-4 px-4 text-right text-black w-1/4">Amount</th>
                <th className="py-4 px-4 text-right text-black w-1/4">Price</th>
                <th className="py-4 px-4 text-right text-black w-1/4">Value</th>
              </tr>
            </thead>
            <tbody>
              {daoHoldings.map((holding, index) => (
                <tr 
                  key={holding.symbol}
                  className={`text-black ${index % 2 === 0 ? 'bg-[#E8E3D5]' : ''}`}
                >
                  <td className="py-4 px-4">{holding.symbol}</td>
                  <td className="py-4 px-4 text-right">
                    {formatAmount(holding.amount)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {formatPrice(holding.price)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {formatValue(holding.amount, holding.price)}
                  </td>
                </tr>
              ))}
              <tr className="font-bold text-black">
                <td className="py-4 px-4" colSpan={3}>Total Value</td>
                <td className="py-4 px-4 text-right">
                  {formatValue(daoTotalValue, 1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center p-4 w-full max-w-7xl mx-auto">
      <div className='w-full'>
      <h1 className="text-3xl font-semibold sf-font" style={{ fontFamily: 'SF Compact Rounded', color: '#333', fontWeight: 600, fontSize: '34px', lineHeight: '42px', marginBottom: '24px' }}>Leaderboard</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => {
          setView('partners');
          fetchHolders();
        }} className={`px-4 py-2 rounded-l ${view === 'partners' ? 'bg-[#B5AD94]' : 'bg-[#E8E3D5]'} text-${view === 'partners' ? 'white' : '[#9B8D7D]'} w-full md:w-auto`} style={{ height: '38px', borderRadius: '14px 0 0 14px' }}>
          Partners
        </button>
        <button 
          onClick={() => {
            setView('holdings');
            fetchDaoHoldings();
          }} 
          className={`px-4 py-2 rounded-r ${view === 'holdings' ? 'bg-[#B5AD94]' : 'bg-[#E8E3D5]'}`}
        >
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
            <div className="text-2xl font-bold">${totalNav.toFixed(2)}m</div>
            <div className="text-white">{view === 'partners' ? 'NAV' : 'AUM'}</div>
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
          )) : tokens.map((token, index) => {
            const allocation = token.amount > 0 ? (token.amount / totalWorth) * 100 : 0;
            return (
              <tr
                key={token.mint}
                className={`${index % 2 === 0 ? 'bg-[#E8E3D6] bg-opacity-50' : 'bg-white'} border-b`}
              >
                <td className="py-3 md:py-4 px-2 md:px-4 text-sm md:text-base">
                  {token.mint}
                </td>
                <td className="py-3 md:py-4 px-2 md:px-4 text-right text-sm md:text-base">
                  {token.amount.toLocaleString()}
                </td>
                <td className="py-3 md:py-4 px-2 md:px-4 text-right text-sm md:text-base">
                  {`${allocation.toFixed(2)}%`}
                </td>
                <td className="py-3 md:py-4 px-2 md:px-4 text-right text-sm md:text-base">
                  ${(token.amount * token.uiAmount).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </>
      )}
      {!loading && !error && view === 'partners' && (
        <div className="w-full mt-6 overflow-x-auto">
          <table className="w-full min-w-[600px] text-black" style={{ fontFamily: 'SF Pro Display' }}>
            <thead>
              <tr>
                <th className="py-2 px-2 md:px-4 bg-[#E8E3D5] text-[#9B8D7D] text-left text-sm md:text-base first:rounded-tl-xl">PARTNER</th>
                <th className="py-2 px-2 md:px-4 bg-[#E8E3D5] text-[#9B8D7D] text-right text-sm md:text-base">TRUST SCORE</th>
                <th className="py-2 px-2 md:px-4 bg-[#E8E3D5] text-[#9B8D7D] text-right text-sm md:text-base">HOLDINGS</th>
                <th className="py-2 px-2 md:px-4 bg-[#E8E3D5] text-[#9B8D7D] text-right text-sm md:text-base last:rounded-tr-xl">NAV</th>
              </tr>
            </thead>
            <tbody>
              {holders.map((holder, index) => (
                <tr 
                  key={holder.owner}
                  className={`${index % 2 === 0 ? 'bg-[#E8E3D5] bg-opacity-50' : 'bg-[#9B8D7D]'} border-b hover:bg-opacity-80`}
                >
                  <td className="py-3 md:py-4 px-2 md:px-4 text-sm md:text-base">
                    <div className="flex items-center space-x-2">
                      <span className="hidden md:inline">{holder.owner}</span>
                      <span className="md:hidden">{`${holder.owner.slice(0,4)}...${holder.owner.slice(-4)}`}</span>
                    </div>
                  </td>
                  <td className="py-3 md:py-4 px-2 md:px-4 text-right text-sm md:text-base">
                    {holder.trustScore?.toFixed(2) || '0.00'}
                  </td>
                  <td className="py-3 md:py-4 px-2 md:px-4 text-right text-sm md:text-base">
                    {(holder.amount || 0).toLocaleString()}
                  </td>
                  <td className="py-3 md:py-4 px-2 md:px-4 text-right text-sm md:text-base">
                    ${(holder.nav || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <DaoHoldingsTable />
    </div>
  );
};

export default LeaderBoard;
