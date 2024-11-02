import type { NextApiRequest, NextApiResponse } from 'next';
import { getTokenPrices } from './tokenPrices';

// Interfaces
interface TokenInfo {
  mint: string;
  cgId: string;
  program: 'spl-token' | 'spl-token-2022';
}

export interface TokenBalance {
  mint: string;
  symbol: string;
  amount: number;
  price: number;
  value: number;
  decimals: number;
}

interface HeliusAsset {
  id: string;
  interface: string;
  content: {
    symbol: string;
    decimals: number;
  };
  token_info: {
    balance: string;
    price: number;
  };
}

// Define tracked token mints
export const TRACKED_TOKENS = [
  'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
  'Gu3LDkn7Vx3bmCzLafYNKcDxv2mH7YN44NJZFXnypump'
];

// Define allowed tokens with metadata
export const TOKEN_INFO: { [mint: string]: TokenInfo } = {
  'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC': { 
    mint: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC', 
    cgId: 'ai16z',
    program: 'spl-token-2022'
  },
  'Gu3LDkn7Vx3bmCzLafYNKcDxv2mH7YN44NJZFXnypump': { 
    mint: 'Gu3LDkn7Vx3bmCzLafYNKcDxv2mH7YN44NJZFXnypump', 
    cgId: 'degen-spartan-ai',
    program: 'spl-token'
  }
};

async function getHeliusAssets(address: string): Promise<HeliusAsset[]> {
  const response = await fetch(process.env.HELIUS_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'holdings-fetch',
      method: 'getAssetsByOwner',
      params: {
        ownerAddress: address,
        page: 1,
        limit: 1000,
        displayOptions: {
          showFungible: true
        }
      },
    }),
  });

  const { result } = await response.json();
  return result.items;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TokenBalance[] | { message: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { address } = req.query;
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ message: 'Valid address required' });
    }

    const assets = await getHeliusAssets(address);
    
    const balances: TokenBalance[] = assets
      .filter(asset => asset.interface === 'V1_TOKEN')
      .map(asset => ({
        mint: asset.id,
        symbol: asset.content.symbol,
        decimals: asset.content.decimals,
        amount: parseInt(asset.token_info.balance),
        price: asset.token_info.price || 0,
        value: (parseInt(asset.token_info.balance) / Math.pow(10, asset.content.decimals)) * 
               (asset.token_info.price || 0)
      }));

    return res.status(200).json(balances);
  } catch (error) {
    console.error('Profile Holdings API error:', error);
    return res.status(500).json({ message: 'Failed to fetch holdings' });
  }
}