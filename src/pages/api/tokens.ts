// pages/api/tokens.ts
import type { NextApiRequest, NextApiResponse } from 'next';

interface TokenResponse {
  mint: string;
  amount: number;
  decimals: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const HELIUS_URL = `https://mainnet.helius-rpc.com/${process.env.NEXT_PUBLIC_SOLANA_API}`;
  const TRACKED_TOKENS = [
    'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
    'Gu3LDkn7Vx3bmCzLafYNKcDxv2mH7YN44NJZFXnypump'
  ];

  if (!req.body.wallet) {
    return res.status(400).json({ error: 'Wallet address required' });
  }

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
        params: [req.body.wallet]
      }),
    });

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.result) {
      const tokens = data.result
        .filter((token: any) => TRACKED_TOKENS.includes(token.mint))
        .map((token: any) => ({
          mint: token.mint,
          amount: token.amount,
          decimals: token.decimals
        }));

      return res.status(200).json({ tokens });
    }

    res.status(200).json({ tokens: [] });
  } catch (error) {
    console.error('Token fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch token data' });
  }
}