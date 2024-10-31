import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

interface TokenResponse {
  mint: string;
  amount: number;
  decimals: number;
  price?: number;
}

interface TokenInfo {
  mint: string;
  cgId: string;  // CoinGecko ID
}

// Token mapping
const TRACKED_TOKENS: TokenInfo[] = [
  {
    mint: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQHXPQYzXbB8n4V98jwC',
    cgId: 'ai16z'
  },
  {
    mint: 'Gu3LDkn7Vx3bmCzLafYNKcDxv2mH7YN44NJZFXnypump',
    cgId: 'degenai'  // Replace with actual CoinGecko ID
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify NextAuth session
  const token = await getToken({ req });
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_SOLANA_API}`;
  const CG_API_KEY = process.env.NEXT_PUBLIC_CG_API;

  // Validate request method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate wallet address
  if (!req.body.wallet) {
    return res.status(400).json({ error: 'Wallet address required' });
  }

  try {
    // Fetch token prices from CoinGecko
    const cgIds = TRACKED_TOKENS.map(t => t.cgId).join(',');
    const priceResponse = await fetch(
      `https://pro-api.coingecko.com/api/v3/simple/price?ids=${cgIds}&vs_currencies=usd&x_cg_pro_api_key=${CG_API_KEY}`
    );

    if (!priceResponse.ok) {
      console.error('CoinGecko API Error:', await priceResponse.text());
      throw new Error(`CoinGecko API error: ${priceResponse.status}`);
    }

    const priceData = await priceResponse.json();
    console.log('Price data:', priceData);

    // Create price mapping
    const priceMapping = TRACKED_TOKENS.reduce((acc, token) => ({
      ...acc,
      [token.mint]: priceData[token.cgId]?.usd || 0
    }), {} as { [mint: string]: number });

    // Fetch token balances
    const balanceResponse = await fetch(HELIUS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'token-balances',
        method: 'getTokenAccountsByOwner',
        params: [
          req.body.wallet,
          { programId: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb' },
          { encoding: 'jsonParsed' }
        ],
      }),
    });

    if (!balanceResponse.ok) {
      throw new Error(`Helius API error: ${balanceResponse.status}`);
    }

    const balanceData = await balanceResponse.json();
    
    if (balanceData.result?.value) {
      const tokens = balanceData.result.value
        .map((tokenAccount: any) => {
          try {
            const mint = tokenAccount.account.data.parsed.info.mint;
            const trackedToken = TRACKED_TOKENS.find(t => t.mint === mint);
            
            if (!trackedToken) return null;

            return {
              mint,
              amount: tokenAccount.account.data.parsed.info.tokenAmount.amount,
              decimals: tokenAccount.account.data.parsed.info.tokenAmount.decimals,
              price: priceMapping[mint] || 0
            };
          } catch (err) {
            console.error('Error processing token:', err);
            return null;
          }
        })
        .filter((token): token is TokenResponse => token !== null);

      return res.status(200).json({ 
        tokens,
        prices: priceMapping
      });
    }

    res.status(200).json({ 
      tokens: [],
      prices: priceMapping
    });
  } catch (error) {
    console.error('API error:', error);
    
    if (error instanceof Error) {
      res.status(500).json({ 
        error: 'Failed to fetch data', 
        details: error.message 
      });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};