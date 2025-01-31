import React from 'react';

export const Button = ({ children, variant = 'default', className = '', onClick }) => {
  const baseStyles = "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2";
  const variants = {
    default: "bg-cyan-500 text-white hover:bg-cyan-600 focus:ring-cyan-500/50",
    ghost: "text-gray-300 hover:text-white hover:bg-gray-800 focus:ring-gray-500/50"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
