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

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_SOLANA_API;
const CG_API_KEY = process.env.NEXT_PUBLIC_CG_API;
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

async function getTokenPrice(cgId: string): Promise<number> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`
    );
    const data = await response.json();
    return data[cgId]?.usd || 0;
  } catch (error) {
    console.error('Price fetch error:', error);
    return 0;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!HELIUS_API_KEY || !CG_API_KEY) {
    return res.status(500).json({ 
      error: 'API keys not configured properly' 
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address required' });
  }

  try {
    const response = await fetch(HELIUS_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'my-id',
        method: 'getTokenBalances',
        params: {
          ownerAddress: walletAddress,
          tokenAddresses: Object.keys(TOKEN_INFO)
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }

    const data = await response.json();
    
    const balances = await Promise.all(
      (data.result || []).map(async (token: any) => {
        const tokenInfo = TOKEN_INFO[token.mint];
        const price = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${tokenInfo.cgId}&vs_currencies=usd&x_cg_api_key=${CG_API_KEY}`
        ).then(r => r.json())
        .then(data => data[tokenInfo.cgId]?.usd || 0);

        return {
          mint: token.mint,
          symbol: tokenInfo.cgId,
          amount: token.amount,
          price,
          value: token.amount * price
        };
      })
    );

    return res.status(200).json({
      walletAddress,
      balances,
      totalValue: balances.reduce((sum, b) => sum + b.value, 0)
    });

  } catch (error) {
    console.error('Profile holdings error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch holdings' 
    });
  }
}