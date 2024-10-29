import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import React from 'react';

/**
 * Constructs a URL for viewing details on the Solana explorer.
 * 
 * @param endpoint - The network endpoint ('localnet', 'devnet', etc.).
 * @param viewTypeOrItemAddress - Can be 'inspector', a PublicKey, or other string address.
 * @param itemType - The type of item to view ('address', 'tx', 'block').
 * @returns The full URL to the Solana explorer for the given parameters.
 */
export function getExplorerUrl(
  endpoint: string,
  viewTypeOrItemAddress: 'inspector' | PublicKey | string,
  itemType: 'address' | 'tx' | 'block' = 'address'
): string {
  const getClusterUrlParam = () => {
    let cluster = '';
    if (endpoint === 'localnet') {
      cluster = `custom&customUrl=${encodeURIComponent('http://127.0.0.1:8899')}`;
    } else if (endpoint === 'https://api.devnet.solana.com') {
      cluster = 'devnet';
    }

    return cluster ? `?cluster=${cluster}` : '';
  };

  const address = viewTypeOrItemAddress instanceof PublicKey ? viewTypeOrItemAddress.toBase58() : viewTypeOrItemAddress;
  return `https://explorer.solana.com/${itemType}/${address}${getClusterUrlParam()}`;
}

/**
 * A higher-order component that provides Solana wallet functionality to wrapped components.
 * 
 * @param Component - The React component to enhance.
 * @returns The component with added wallet props.
 */
export function withWallet(Component) {
  return function WithWalletProps(props) {
    const wallet = useWallet();
    return <Component {...props} wallet={wallet} />;
  };
}
