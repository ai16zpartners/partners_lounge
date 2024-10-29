// registry/index.tsx
import type { NextApiRequest, NextApiResponse } from 'next';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { withWallet } from '../utils/withWallet';

const connection = new Connection('https://spl_governance:explorer_api_key@spl_governance.api.mainnet-beta.solana.com/', 'confirmed');

// Mock registry storage (In a real app, use a database)
let registry = [];

async function handleCreateEntry(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { 
    userName, 
    aiAgentId, 
    aiAgentWalletAddress 
  } = req.body;

  if (!userName || !aiAgentId || !aiAgentWalletAddress) 
    return res.status(400).json({ message: 'All fields are required' });

  try {
    const newEntry = {
      id: registry.length + 1,
      owner: req.wallet.publicKey.toString(), // User's wallet address
      data: {
        userName,
        aiAgentId,
        aiAgentWalletAddress,
      },
      timestamp: new Date().toISOString(),
    };
    registry.push(newEntry);
    return res.status(201).json(newEntry);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create entry' });
  }
}

async function handleGetEntries(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  try {
    return res.status(200).json(registry);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch entries' });
  }
}

export default withWallet(async function handler(req, res) {
  switch (req.method) {
    case 'POST':
      await handleCreateEntry(req, res);
      break;
    case 'GET':
      await handleGetEntries(req, res);
      break;
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
});