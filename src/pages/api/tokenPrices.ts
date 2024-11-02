// api/tokenPrices.ts
import { NextApiRequest, NextApiResponse } from 'next';

const CG_API_KEY = process.env.NEXT_PUBLIC_CG_API;
const CG_BASE_URL = 'https://api.coingecko.com/api/v3';

interface TokenPriceOptions {
  includeMarketCap?: boolean;
  include24hVol?: boolean;
  include24hChange?: boolean;
  includeLastUpdated?: boolean;
  precision?: number;
}

export async function getTokenPrices(
  platform: string = 'solana',
  contractAddresses: string[],
  currencies: string[] = ['usd'],
  options: TokenPriceOptions = {}
) {
  try {
    const queryParams = new URLSearchParams({
      contract_addresses: contractAddresses.join(','),
      vs_currencies: currencies.join(','),
      include_market_cap: options.includeMarketCap?.toString() || 'false',
      include_24hr_vol: options.include24hVol?.toString() || 'false',
      include_24hr_change: options.include24hChange?.toString() || 'false',
      include_last_updated_at: options.includeLastUpdated?.toString() || 'false',
      ...(options.precision && { precision: options.precision.toString() })
    });

    const response = await fetch(
      `${CG_BASE_URL}/simple/token_price/${platform}?${queryParams}&x_cg_demo_api_key=${CG_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch token prices');
    }

    return await response.json();

  } catch (error) {
    console.error('Error fetching token prices:', error);
    throw error;
  }
}

// API Route Handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { platform, contracts, currencies, ...options } = req.query;

    if (!contracts) {
      return res.status(400).json({ message: 'Contract addresses are required' });
    }

    const contractAddresses = Array.isArray(contracts) ? contracts : [contracts];
    const currencyList = currencies ? (Array.isArray(currencies) ? currencies : [currencies]) : ['usd'];

    const data = await getTokenPrices(
      platform as string,
      contractAddresses,
      currencyList,
      options as TokenPriceOptions
    );

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch token prices' });
  }
}