import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

interface TokenResponse {
  mint: string;
  amount: number;
  decimals: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify NextAuth session
  const token = await getToken({ req });
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const HELIUS_URL = `https://mainnet.helius-rpc.com/${process.env.NEXT_PUBLIC_SOLANA_API}`;
  const TRACKED_TOKENS = [
    'HeLp6NuQkmYB4pYWo2zYs22mESHXPQHXPQYzXbB8n4V98jwC',
    'Gu3LDkn7Vx3bmCzLafYNKcDxv2mH7YN44NJZFXnypump'
  ];

  // Validate request method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate wallet address
  if (!req.body.wallet) {
    return res.status(400).json({ error: 'Wallet address required' });
  }

  try {
    console.log('Fetching token balances for wallet:', req.body.wallet);
    console.log('Helius URL:', HELIUS_URL);

    const response = await fetch(HELIUS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Optional: Add authorization if Helius requires it
        ...(process.env.NEXT_PUBLIC_SOLANA_API 
          ? { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SOLANA_API}` } 
          : {})
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'token-balances',
        method: 'getTokenBalances',
        params: [req.body.wallet]
      }),
    });

    // Log full response for debugging
    const responseText = await response.text();
    console.log('Helius API Response Status:', response.status);
    console.log('Helius API Response Body:', responseText);

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status} - ${responseText}`);
    }

    // Parse response safely
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return res.status(500).json({ error: 'Failed to parse API response' });
    }
    
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
    
    // More detailed error response
    if (error instanceof Error) {
      res.status(500).json({ 
        error: 'Failed to fetch token data', 
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