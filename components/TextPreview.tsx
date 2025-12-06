import React from 'react';
import Loader from './Loader';

interface TextPreviewProps {
  text: string;
  cleanedText: string;
  loading: boolean;
}

const TextPreview: React.FC<TextPreviewProps> = ({ text, cleanedText, loading }) => {
  return (
    <div className="flex flex-col space-y-6 flex-grow">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col flex-grow">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-600 dark:text-indigo-300">Extracted/Pasted Text Preview</h2>
        {loading ? (
          <div className="flex justify-center items-center flex-grow">
            <Loader message="Extracting text..." />
          </div>
        ) : (
          <div className="relative flex-grow">
            <textarea
              className="w-full h-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none"
              value={text || "No text available for preview."}
              readOnly
            ></textarea>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col flex-grow">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-600 dark:text-indigo-300">Cleaned Text (Gemini)</h2>
        {loading ? (
          <div className="flex justify-center items-center flex-grow">
            <Loader message="Cleaning text with Gemini..." />
          </div>
        ) : (
          <div className="relative flex-grow">
            <textarea
              className="w-full h-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none"
              value={cleanedText || (text ? "Text will appear here after Gemini cleanup." : "No text available for cleanup.")}
              readOnly
            ></textarea>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextPreview;
