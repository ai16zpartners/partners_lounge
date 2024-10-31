import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const FetchAssets = () => {
    const { publicKey } = useWallet();
    const [assets, setAssets] = useState([]);

    useEffect(() => {
        if (publicKey) {
            fetchAssets();
        }
    }, [publicKey]);

    const fetchAssets = async () => {
        const url = 'https://mainnet.helius-rpc.com/?api-key=1b96ba6b-86cb-45c5-be3d-508acccdce72';
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 'fetch-assets',
                    method: 'getAssetsByOwner',
                    params: {
                        ownerAddress: publicKey.toString(),
                        page: 1,
                        limit: 10,
                        displayOptions: {
                            showFungible: true
                        }
                    },
                }),
            });
            const jsonData = await response.json();
            if (jsonData.result) {
                setAssets(jsonData.result.items);
            }
        } catch (error) {
            console.error('Failed to fetch assets:', error);
        }
    };

    return (
        <div>
            <h1>Your Assets</h1>
            {assets.length > 0 ? (
                <ul>
                    {assets.map((asset, index) => (
                        <li key={index}>{asset.name} - Balance: {asset.balance}</li>
                    ))}
                </ul>
            ) : (
                <p>No assets found or wallet not connected.</p>
            )}
        </div>
    );
};

export default FetchAssets;