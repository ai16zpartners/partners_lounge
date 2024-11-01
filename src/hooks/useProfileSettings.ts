// hooks/useProfileSettings.ts
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSession } from 'next-auth/react';

interface UserPreferences {
  notifications: boolean;
  publicProfile: boolean;
  displayWallet: boolean;
  theme: 'light' | 'dark' | 'system';
}

export const useProfileSettings = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    notifications: true,
    publicProfile: false,
    displayWallet: true,
    theme: 'system'
  });
  const [isSaving, setIsSaving] = useState(false);
  const wallet = useWallet();
  const { data: session } = useSession();

  const savePreferences = async (newPrefs: Partial<UserPreferences>) => {
    setIsSaving(true);
    // Save logic here
    setIsSaving(false);
  };

  return { preferences, savePreferences, isSaving };
};