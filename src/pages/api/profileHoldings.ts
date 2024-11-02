import type { NextApiRequest, NextApiResponse } from 'next';
import { getTokenPrices } from './tokenPrices';

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

interface TokenHolding {
  mint: string;
  amount: number;
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
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ message: 'Valid address required' });
    }

    // Get holdings from Helius
    const holdingsRes = await fetch(`${process.env.NEXTAUTH_URL}/api/holdings?address=${address}`);
    if (!holdingsRes.ok) {
      throw new Error(`Holdings fetch failed: ${holdingsRes.status}`);
    }
    
    const holdings = await holdingsRes.json() as TokenHolding[];

    // Filter only allowed tokens and add prices
    const filteredHoldings = holdings
      .filter((holding) => TOKEN_INFO[holding.mint])
      .map((holding) => ({
        mint: holding.mint,
        amount: holding.amount,
        tokenInfo: TOKEN_INFO[holding.mint]
      }));

    return res.status(200).json(filteredHoldings);

  } catch (error) {
    console.error('Profile Holdings API error:', error);
    return res.status(500).json({ message: 'Failed to fetch profile holdings' });
  }
}