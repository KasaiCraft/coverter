import React from 'react';
import Loader from './Loader';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, loading, className, disabled, ...rest }) => {
  return (
    <button
      className={`
        bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md
        transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75
        dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus:ring-indigo-400
        ${loading || disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className || ''}
      `}
      disabled={loading || disabled}
      {...rest}
    >
      {loading ? <Loader /> : children}
    </button>
  );
};

export default Button;
