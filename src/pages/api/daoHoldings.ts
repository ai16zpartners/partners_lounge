import type { NextApiRequest, NextApiResponse } from 'next';

// Interfaces
interface TokenConfig {
  mint: string;
  cgId: string;
  program: string;
}

interface TokenBalance {
  symbol: string;
  amount: number;
  price: number;
  value: number;
}

interface TokenInfo {
  address: string;
  balances: TokenBalance[];
  totalValue: number;
}

// Dynamic token configuration
let TOKEN_CONFIG: Record<string, TokenConfig> = {};

// Constants
const DAO_ADDRESS = 'AM84n1iLdxgVTAyENBcLdjXoyvjentTbu5Q6EpKV1PeG';
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_SOLANA_API;
const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const CG_API_KEY = process.env.NEXT_PUBLIC_CG_API;

// Function to fetch and populate token config
async function fetchTokenConfig() {
  try {
    const response = await fetch(HELIUS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'tokens-query',
        method: 'searchAssets',
        params: {
          ownerAddress: DAO_ADDRESS,
          tokenType: 'fungible',
          displayOptions: {
            showNativeBalance: true,
          },
        },
      }),
    });

    const { result } = await response.json();
    
    // Populate TOKEN_CONFIG
    result.items.forEach((item: any) => {
      TOKEN_CONFIG[item.id] = {
        mint: item.id,
        cgId: item.token_info?.symbol?.toLowerCase() || '',
        program: item.token_info?.program || 'spl-token'
      };
    });

    // Add native SOL
    TOKEN_CONFIG['So11111111111111111111111111111111111111112'] = {
      mint: 'So11111111111111111111111111111111111111112',
      cgId: 'solana',
      program: 'system'
    };

    return TOKEN_CONFIG;
  } catch (error) {
    console.error('Error fetching token config:', error);
    return {};
  }
}

// Helper functions
async function fetchTokenBalances(heliusApiKey: string) {
  const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'my-id',
      method: 'searchAssets',
      params: {
        ownerAddress: DAO_ADDRESS,
        tokenType: 'fungible',
        displayOptions: { showNativeBalance: true }
      }
    })
  });
  return response.json();
}

async function getPrices(cgApiKey: string, tokens: TokenConfig[]) {
  const ids = tokens.map(t => t.cgId).join(',');
  const response = await fetch(
    `https://pro-api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
    { headers: { 'x-cg-pro-api-key': cgApiKey } }
  );
  return response.json();
}

// Main handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TokenInfo | { error: string }>
) {
  if (!HELIUS_API_KEY || !CG_API_KEY) {
    return res.status(500).json({ error: 'API keys not configured' });
  }

  try {
    await fetchTokenConfig();
    const tokenData = await fetchTokenBalances(HELIUS_API_KEY);
    const prices = await getPrices(CG_API_KEY, Object.values(TOKEN_CONFIG));

    const balances: TokenBalance[] = tokenData.result.items
      .filter((token: any) => TOKEN_CONFIG[token.id])
      .map((token: any) => {
        const config = TOKEN_CONFIG[token.id];
        const price = prices[config.cgId]?.usd || 0;
        return {
          symbol: token.token_info?.symbol || 'Unknown',
          amount: token.token_info?.balance || 0,
          price,
          value: (token.token_info?.balance || 0) * price
        };
      });

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