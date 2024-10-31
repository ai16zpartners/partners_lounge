import React, { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Image from 'next/image';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Session } from 'next-auth';

interface Partner {
  id: string;
  name: string;
  avatar: string;
  trustScore: number;
  holdings: number;
}

interface Token {
  mint: string;
  amount: number;
  uiAmount: number;
}

interface SocialConnection { 
  platform: string;
  connected: boolean;
  profileImage?: string;
  userName?: string;
}

interface SessionUser extends Session {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    connections?: {
      discord?: { id: string; userName: string; image?: string };
      twitter?: { id: string; userName: string; image?: string };
      github?: { id: string; userName: string; image?: string };
      linkedin?: { id: string; userName: string; image?: string };
    };
    trustScore?: number;
  };
}

export const Profile: FC = () => {
  const [view, setView] = useState('profile');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [totalWorth, setTotalWorth] = useState<number>(0);
  const [newPartners, setNewPartners] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { data: session } = useSession() as { data: SessionUser };
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([
    { platform: 'discord', connected: false },
    { platform: 'twitter', connected: false },
    { platform: 'github', connected: false },
  ]);
  const [trustScore, setTrustScore] = useState(0);
  const [userProfileImage, setUserProfileImage] = useState('');
  const [userName, setUserName] = useState('');
  const wallet = useWallet();
  const walletAddress = wallet.publicKey?.toBase58() || 'No wallet connected';

  useEffect(() => {
    if (session?.user) {
      setIsSignedIn(true);
      // Update social connections based on session
      const updatedConnections = socialConnections.map(conn => ({
        ...conn,
        connected: !!session.user?.connections?.[conn.platform as keyof typeof session.user.connections],
        profileImage: session.user?.connections?.[conn.platform as keyof typeof session.user.connections]?.image,
        userName: session.user?.connections?.[conn.platform as keyof typeof session.user.connections]?.userName
      }));
      setSocialConnections(updatedConnections);
      
      // Calculate trust score
      const walletPoints = wallet.connected ? 10 : 0;
      const socialPoints = updatedConnections.filter(conn => conn.connected).length * 30;
      setTrustScore(walletPoints + socialPoints);
    }
  }, [session, wallet.connected]);

  const fetchPartnersData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/partners');
      const data = await response.json();
      setPartners(data.partners);
      setTotalWorth(data.totalWorth);
      setNewPartners(data.newPartners);
    } catch (err) {
      setError('Failed to fetch partners data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTokenData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tokens');
      const data = await response.json();
      setTokens(data.tokens);
    } catch (err) {
      setError('Failed to fetch token data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      fetchPartnersData();
      if (view === 'holdings') {
        fetchTokenData();
      }
    }
  }, [wallet, view]);

    return (
    <div className="flex flex-col items-center p-4 w-full max-w-7xl mx-auto">
      <h1 className="text-3xl font-semibold" style={{ fontFamily: 'SF Compact Rounded', color: '#333', fontWeight: 600, fontSize: '34px', lineHeight: '42px', marginBottom: '24px' }}>Profile</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setView('profile')} className={`px-4 py-2 rounded-l ${view === 'profile' ? 'bg-[#B5AD94]' : 'bg-[#E8E3D5]'} text-${view === 'profile' ? 'white' : '[#9B8D7D]'} w-full md:w-auto`} style={{ height: '38px', borderRadius: '14px 0 0 14px' }}>
          Profile
        </button>
        <button onClick={() => setView('holdings')} className={`px-4 py-2 rounded-r ${view === 'holdings' ? 'bg-[#B5AD94]' : 'bg-[#E8E3D5]'} text-${view === 'holdings' ? 'white' : '[#9B8D7D]'} w-full md:w-auto`} style={{ height: '38px', borderRadius: '0 14px 14px 0' }}>
          Holdings
        </button>
      </div>

      <div style={{ background: 'linear-gradient(180deg, #9C9584 0%, #736B55 100%)', color: '#FFFFFF', borderRadius: '12px', padding: '10px 20px', width: '100%', boxSizing: 'border-box' }}>
  <div className="flex flex-wrap justify-around text-center mb-4">
    <div>
      <div className="text-2xl font-bold">{trustScore}</div>
      <div className="text-white">Trust Score</div>
    </div>
    <div>
      <div className="text-2xl font-bold">${totalWorth.toFixed(2)}</div>
      <div className="text-white">Total Worth</div>
    </div>
    <div>
      <div className="text-2xl font-bold">+{newPartners}</div>
      <div className="text-white">New Partners (7D)</div>
    </div>
  </div>
</div>

  {view === 'profile' && (
    <div className="flex flex-col items-start w-full">
      <div className="w-full" style={{ padding: '24px', borderRadius: '12px', marginTop: '24px' }}>
        <h1 style={{ fontFamily: 'SF Compact Rounded', fontSize: '18px', fontWeight: 600, lineHeight: '24px', textAlign: 'left', color: '#000' }}>Socials</h1>
        <div className='flex flex-row flex-wrap gap-2 mt-4'>
          {socialConnections.map((connection) => (
            connection.connected ? (
              <button 
                key={connection.platform}
                className="rounded-full bg-[#F98C13] text-white font-bold py-2 px-4 flex items-center gap-2"
                onClick={() => signOut({ callbackUrl: `/profile?platform=${connection.platform}` })}
              >
                {connection.profileImage && (
                  <Image 
                    src={connection.profileImage}
                    alt={connection.userName || ''}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <span>{connection.userName}</span>
              </button>
            ) : (
              <button 
                key={connection.platform}
                className="rounded-full bg-[#9B8D7D] text-white font-bold py-2 px-4"
                onClick={() => signIn(connection.platform)}
              >
                Connect {connection.platform.charAt(0).toUpperCase() + connection.platform.slice(1)}
              </button>
            )
          ))}
        </div>
      </div>

      <div className="w-full mt-6">
        <h1 style={{ fontFamily: 'SF Compact Rounded', fontSize: '18px', fontWeight: 600, lineHeight: '24px', textAlign: 'left', color: '#242424' }}>Wallets</h1>
        <div className="mt-4" style={{ background: '#9B8D7D', padding: '16px', borderRadius: '8px' }}>
          <h2 className="font-bold text-lg text-white">Wallet Address</h2>
          <p className="text-white mt-2">{walletAddress}</p>
        </div>
      </div>
    </div>
  )}
    </div>
  );
};

export default Profile;