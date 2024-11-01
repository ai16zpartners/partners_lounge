// components/ui/Switch.tsx
import { FC } from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Switch: FC<SwitchProps> = ({ checked, onChange, disabled }) => {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full 
        transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        ${checked ? 'bg-green-600' : 'bg-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
};