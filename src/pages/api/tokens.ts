import type { NextApiRequest, NextApiResponse } from 'next';

interface TokenResponse {
  mint: string;
  amount: number;
  decimals: number;
  price?: number;
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { wallet } = req.body;

  if (!wallet) {
    return res.status(400).json({ error: 'Wallet address required' });
  }

  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${Object.values(TOKEN_INFO).map(token => token.cgId).join(',')}&vs_currencies=usd`);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const prices = await response.json();

    // Fetch both SPL Token and SPL Token 2022 accounts
    const fetchTokenAccounts = async (programId: string) => {
      const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_SOLANA_API}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'get-token-accounts',
          method: 'getTokenAccountsByOwner',
          params: [
            wallet,
            { programId },
            { encoding: 'jsonParsed' }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Helius API error: ${response.status}`);
      }

      return (await response.json()).result.value;
    };

    // Fetch accounts from both programs
    const [splTokenAccounts, splToken2022Accounts] = await Promise.all([
      fetchTokenAccounts(PROGRAM_IDS['spl-token']),
      fetchTokenAccounts(PROGRAM_IDS['spl-token-2022'])
    ]);

    // Process accounts from both programs
    const processAccounts = (accounts: any[]) => 
      accounts
        .filter((token: any) => TOKEN_INFO[token.account.data.parsed.info.mint])
        .map((token: any) => {
          const mint = token.account.data.parsed.info.mint;
          const amount = token.account.data.parsed.info.tokenAmount.amount;
          const decimals = token.account.data.parsed.info.tokenAmount.decimals;
          const price = prices[TOKEN_INFO[mint].cgId]?.usd || 0;
          const value = (parseInt(amount) / Math.pow(10, decimals)) * price;

          return { mint, amount, decimals, price, value };
        });

    const tokens = [
      ...processAccounts(splTokenAccounts),
      ...processAccounts(splToken2022Accounts)
    ];

    res.status(200).json({ tokens });
  } catch (error) {
    console.error('Token fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};