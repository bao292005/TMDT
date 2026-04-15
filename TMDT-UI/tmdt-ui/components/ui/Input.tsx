import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full flex flex-col gap-1">
      {label && <label className="text-sm text-gray-600">{label}</label>}
      <input 
        className={`w-full border p-2.5 rounded-sm outline-none transition-colors text-sm 
          ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#ee4d2d]'} 
          ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};