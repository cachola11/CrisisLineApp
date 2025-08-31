import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, label }) => {
  return (
    <div className="flex items-center">
      <label htmlFor="upcoming-switch" className="mr-3 text-sm font-bold text-brand-700 whitespace-nowrap">
        {label}
      </label>
      <button
        id="upcoming-switch"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex items-center h-7 w-14 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ${
          checked ? 'bg-success' : 'bg-gray-300'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-300 ease-in-out flex items-center justify-center ${
            checked ? 'translate-x-8' : 'translate-x-1'
          }`}
        >
          {/* Animated Icon inside the switch */}
          {checked ? (
             <svg className="h-4 w-4 text-success transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-gray-400 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </span>
      </button>
    </div>
  );
};

export default Switch; 