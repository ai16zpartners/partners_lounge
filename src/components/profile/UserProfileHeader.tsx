// components/profile/UserProfileHeader.tsx
import { FC } from 'react';
import Image from 'next/image';
import { useProfileData } from '../../hooks/useProfileData';

export const UserProfileHeader: FC = () => {
  const { userImage, userName, walletAddress, isConnected } = useProfileData();

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-[#E8E3D5] rounded-xl">
      <div className="relative w-24 h-24">
        <Image
          src={userImage}
          alt="Profile"
          layout="fill"
          className="rounded-full"
          objectFit="cover"
        />
      </div>
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold">{userName || 'Anonymous'}</h2>
        <p className="text-gray-600">
          {isConnected ? 
            `${walletAddress?.slice(0,4)}...${walletAddress?.slice(-4)}` : 
            'Wallet not connected'}
        </p>
      </div>
    </div>
  );
};