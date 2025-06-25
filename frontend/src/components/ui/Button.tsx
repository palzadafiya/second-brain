import React, { ReactNode } from 'react';

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'plain';
  text: string;
  startIcon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({ variant, text, startIcon, onClick, disabled = false }: ButtonProps) {
  const baseClasses = "flex items-center gap-2 transition-colors";
  
  const variantClasses = {
    primary: "bg-black-600 hover:bg-opacity-80 text-white px-4 py-2 rounded-md",
    secondary: "bg-gray-200 hover:bg-gray-300 text-black-600 px-4 py-2 rounded-md",
    plain: "text-black-600 hover:bg-beige-400 px-4 py-2 rounded-md w-full text-left"
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {startIcon && <span className="flex-shrink-0">{startIcon}</span>}
      <span>{text}</span>
    </button>
  );
} 