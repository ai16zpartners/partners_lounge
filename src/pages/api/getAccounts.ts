// pages/api/getAccounts.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const API_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_SOLANA_API}`;
const MINT_ADDRESS = "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC";
const DECIMALS = 9;
const MIN_AMOUNT = 100000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAllTokenAccounts() {
  const holdings = [];
  let cursor;
  
  try {
    do {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "helius-test",
          method: "getTokenAccounts",
          params: { 
            limit: 1000, 
            mint: MINT_ADDRESS, 
            ...(cursor && { cursor }) 
          }
        }),
      });

      const { result } = await response.json();
      
      if (!result?.token_accounts?.length) break;
      
      result.token_accounts.forEach((acc: any) => {
        const formattedAmount = Number(acc.amount) / Math.pow(10, DECIMALS);
        if (formattedAmount >= MIN_AMOUNT) {
          holdings.push({
            owner: acc.owner,
            amount: formattedAmount,
            percentage: (formattedAmount / 109999988538) * 100
          });
        }
      });
      
      cursor = result.cursor;
      console.log(`Processed ${holdings.length} qualifying accounts`);
      
      await sleep(50); // Rate limiting
    } while (cursor);

    return holdings;
  } catch (error) {
    console.error("Error fetching token accounts:", error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const holders = await getAllTokenAccounts();
    // Sort holders by amount descending
    holders.sort((a, b) => b.amount - a.amount);
    res.status(200).json({ holders });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch token accounts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}