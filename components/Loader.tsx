import React from 'react';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 dark:border-indigo-400"></div>
      {message && <p className="mt-3 text-indigo-700 dark:text-indigo-300 text-sm">{message}</p>}
    </div>
  );
};

export default Loader;
