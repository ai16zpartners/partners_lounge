import type { NextApiRequest, NextApiResponse } from 'next';

interface TokenHolder {
  owner: string;
  amount: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 1. Get token holders from Helius
    const heliusResponse = await fetch(`https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_SOLANA_API}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'holders-query',
        method: 'getTokenAccounts',
        params: {
          mint: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
          showZeroBalance: false
        }
      }),
    });

    if (!heliusResponse.ok) {
      throw new Error(`Helius API error: ${heliusResponse.status}`);
    }

    const heliusData = await heliusResponse.json();

    // 2. Get token price from CoinGecko
    const cgResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ai16z&vs_currencies=usd', {
      headers: {
        'x-cg-demo-api-key': process.env.NEXT_PUBLIC_CG_API
      }
    });

    if (!cgResponse.ok) {
      throw new Error(`CoinGecko API error: ${cgResponse.status}`);
    }

    const priceData = await cgResponse.json();
    const tokenPrice = priceData.ai16z?.usd || 0;

    // 3. Process holders data
    const holders = heliusData.token_accounts
      .map((account: any) => ({
        owner: account.owner,
        amount: account.tokenAmount.uiAmount
      }))
      .filter((holder: TokenHolder) => holder.amount >= 100000)
      .sort((a: TokenHolder, b: TokenHolder) => b.amount - a.amount);

    // 4. Calculate metrics
    const totalWorth = holders.reduce((sum: number, holder: TokenHolder) => 
      sum + (holder.amount * tokenPrice), 0);

    // Get new partners in last 7 days (placeholder as we need historical data)
    const newPartners = 0; // This would need historical data comparison

    res.status(200).json({
      partners: holders,
      totalWorth,
      newPartners
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch partners data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
