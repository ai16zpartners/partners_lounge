// components/profile/ProfileSettings.tsx
import { FC } from 'react';
import { useProfileSettings } from '../../hooks/useProfileSettings';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';

export const ProfileSettings: FC = () => {
  const { preferences, savePreferences, isSaving } = useProfileSettings();

  return (
    <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-6">Settings</h3>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Notifications</p>
            <p className="text-sm text-gray-600">Receive activity updates</p>
          </div>
          <Switch
            checked={preferences.notifications}
            onChange={(checked) => savePreferences({ notifications: checked })}
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Public Profile</p>
            <p className="text-sm text-gray-600">Allow others to view your profile</p>
          </div>
          <Switch
            checked={preferences.publicProfile}
            onChange={(checked) => savePreferences({ publicProfile: checked })}
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Display Wallet</p>
            <p className="text-sm text-gray-600">Show wallet address on profile</p>
          </div>
          <Switch
            checked={preferences.displayWallet}
            onChange={(checked) => savePreferences({ displayWallet: checked })}
          />
        </div>

        <div>
          <p className="font-medium mb-2">Theme</p>
          <Select
            value={preferences.theme}
            onChange={(value) => savePreferences({ theme: value })}
            options={[
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
              { label: 'System', value: 'system' }
            ]}
          />
        </div>

        <div className="flex justify-end">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};