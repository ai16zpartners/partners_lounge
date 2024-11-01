// components/ui/Select.tsx
import { FC } from 'react';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
}

export const Select: FC<SelectProps> = ({ value, onChange, options, disabled }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};