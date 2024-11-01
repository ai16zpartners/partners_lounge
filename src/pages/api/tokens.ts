import type { NextApiRequest, NextApiResponse } from 'next';

interface TokenResponse {
  mint?: string;
  amount?: number;
  decimals?: number;
  price?: number;
  holders?: TokenHolderResponse[];
}

interface TokenInfo {
  mint: string;
  cgId: string;
  program: 'spl-token' | 'spl-token-2022';
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

const PROGRAM_IDS = {
  'spl-token': 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  'spl-token-2022': 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
};

interface TokenHolderResponse {
  address: string;
  owner: string;
  amount: number;
  percentage: number;
}

export async function getTokenPrice(mint: string): Promise<number> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;
  const TIMEOUT = 5000;
  
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const tokenInfo = TOKEN_INFO[mint];
      if (!tokenInfo) {
        console.warn(`Token info not found for mint: ${mint}`);
        return 0;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenInfo.cgId}&vs_currencies=usd`,
        {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (response.status === 429) {
        await sleep(RETRY_DELAY * (i + 1));
        continue;
      }

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      return data[tokenInfo.cgId]?.usd || 0;

    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timed out');
      }
      if (i === MAX_RETRIES - 1) {
        console.error('Max retries reached:', error);
        return 0;
      }
      await sleep(RETRY_DELAY * (i + 1));
    }
  }

  return 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TokenResponse>
) {
  try {
    const { mint } = req.query;
    
    if (!mint || typeof mint !== 'string') {
      return res.status(400).json({
        mint: '',
        amount: 0,
        decimals: 0,
        holders: []
      });
    }

    // Fetch holders from Helius API
    const holders = await fetch('https://api.helius.xyz/v0/token-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'helius-test',
        method: 'getTokenAccounts',
        params: { mint }
      })
    })
    .then(res => res.json())
    .then(data => data.result.items || [])
    .then(items => items.map(item => ({
      address: item.address,
      owner: item.owner,
      amount: item.amount,
      percentage: (item.amount / items.reduce((sum, i) => sum + i.amount, 0)) * 100
    })))
    .then(holders => holders.sort((a, b) => b.amount - a.amount));

    return res.status(200).json({
      mint: TOKEN_INFO[mint].mint,
      amount: holders.reduce((sum, h) => sum + h.amount, 0),
      decimals: 9,
      holders: holders
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      mint: '',
      amount: 0,
      decimals: 0,
      holders: []
    });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};