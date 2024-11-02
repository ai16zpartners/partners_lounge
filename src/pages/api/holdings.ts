// pages/api/holdings.ts
import { NextApiRequest, NextApiResponse } from 'next';

// Add interface definition
interface TokenInfo {
  mint: string;
  cgId: string;
  program: 'spl-token' | 'spl-token-2022';
}

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_SOLANA_API;
const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Validate environment variables
if (!HELIUS_API_KEY) {
  console.error('NEXT_PUBLIC_SOLANA_API is not set');
}

// Define allowed tokens
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
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log incoming request
  console.log('Holdings API called with:', { 
    method: req.method,
    query: req.query 
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { address } = req.query;
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ message: 'Valid address required' });
  }

  try {
    if (!HELIUS_API_KEY) {
      throw new Error('Helius API key not configured');
    }

    const response = await fetch(HELIUS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'holdings-query',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: address,
          displayOptions: {
            showFungible: true,
            showNativeBalance: true
          }
        }
      })
    });

    if (!response.ok) {
      console.error('Helius API error:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`Helius API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate and log response
    console.log('Helius API response:', data);

    if (!data.result || !Array.isArray(data.result.items)) {
      throw new Error('Invalid response structure from Helius API');
    }

    // Filter and map holdings
    const holdings = data.result.items
      .filter((item: any) => TOKEN_INFO[item.id])
      .map((item: any) => ({
        mint: item.id,
        symbol: item.token_info?.symbol || 'Unknown',
        amount: item.token_info?.amount || 0,
        decimals: item.token_info?.decimals || 9,
        cgId: TOKEN_INFO[item.id].cgId,
        program: TOKEN_INFO[item.id].program
      }));

    return res.status(200).json(holdings);

  } catch (error) {
    console.error('Holdings API error:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch holdings',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}