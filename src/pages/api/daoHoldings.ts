import type { NextApiRequest, NextApiResponse } from 'next';

interface TokenInfo {
  mint: string;
  cgId: string;
  program: 'spl-token' | 'spl-token-2022';
}

interface TokenBalance {
  mint: string;
  symbol: string;
  amount: number;
  price: number;
  value: number;
}

interface DaoHoldingsResponse {
  address: string;
  balances: TokenBalance[];
  totalValue: number;
}

const TOKEN_INFO: { [mint: string]: TokenInfo } = {
  'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC': { 
    mint: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC', 
    cgId: 'ai16z',
    program: 'spl-token-2022'
  },
  'Gu3LDkn7Vx3bmCzLafYNKcDxv2mH7YN44NJZFXnypump': { 
    mint: 'Gu3LDkn7Vx3bmCzLafYNKcDxv2mH7YN44NJZFXnypump', 
    cgId: 'degen-spartan-ai',
    program: 'spl-token'
  },
};

const DAO_ADDRESS = 'AM84n1iLdxgVTAyENBcLdjXoyvjentTbu5Q6EpKV1PeG';
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_SOLANA_API;
const CG_API_KEY = process.env.NEXT_PUBLIC_CG_API;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DaoHoldingsResponse | { error: string }>
) {
  if (!HELIUS_API_KEY || !CG_API_KEY) {
    return res.status(500).json({ error: 'API keys not configured' });
  }

  try {
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'helius-holdings',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: DAO_ADDRESS,
          page: 1,
          limit: 1000,
          showFungible: true,
          showZeroBalance: false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter for our tracked tokens and get their balances
    const trackedMints = Object.keys(TOKEN_INFO);
    const balances = await Promise.all(
      data.result.items
        .filter((item: any) => trackedMints.includes(item.id))
        .map(async (token: any) => {
          const tokenInfo = TOKEN_INFO[token.id];
          const price = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${tokenInfo.cgId}&vs_currencies=usd&x_cg_api_key=${CG_API_KEY}`
          ).then(r => r.json())
          .then(data => data[tokenInfo.cgId]?.usd || 0);

          return {
            mint: token.id,
            symbol: tokenInfo.cgId,
            amount: token.token_info?.balance || 0,
            price,
            value: (token.token_info?.balance || 0) * price
          };
        })
    );

    return res.status(200).json({
      address: DAO_ADDRESS,
      balances,
      totalValue: balances.reduce((sum, b) => sum + b.value, 0)
    });

  } catch (error) {
    console.error('DAO holdings error:', error);
    return res.status(500).json({ error: 'Failed to fetch DAO holdings' });
  }
}