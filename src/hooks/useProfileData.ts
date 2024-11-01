// hooks/useProfileData.ts
import { useSession } from 'next-auth/react';
import { useWallet } from '@solana/wallet-adapter-react';

export const useProfileData = () => {
  const { data: session } = useSession();
  const wallet = useWallet();

  return {
    userImage: session?.user?.image || '/default-avatar.png',
    userName: session?.user?.name,
    walletAddress: wallet?.publicKey?.toString(),
    isConnected: wallet?.connected
  };
};