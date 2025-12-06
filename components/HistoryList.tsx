import React from 'react';
import { HistoryEntry } from '../types';
import { FaTrash } from 'react-icons/fa';

interface HistoryListProps {
  history: HistoryEntry[];
}

const HistoryList: React.FC<HistoryListProps> = ({ history }) => {
  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      localStorage.removeItem('podcast_history');
      window.location.reload(); // Simple reload to refresh history state
    }
  };

  const removeHistoryEntry = (id: number) => {
    if (window.confirm('Are you sure you want to remove this history entry?')) {
      const updatedHistory = history.filter(entry => entry.id !== id);
      localStorage.setItem('podcast_history', JSON.stringify(updatedHistory));
      window.location.reload(); // Simple reload to refresh history state
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-indigo-600 dark:text-indigo-300">Conversion History</h2>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-500 flex items-center space-x-1"
          >
            <FaTrash />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No conversion history yet. Your past conversions will appear here.</p>
      ) : (
        <ul className="space-y-3">
          {history.map((entry) => (
            <li
              key={entry.id}
              className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-lg text-gray-800 dark:text-gray-200">{entry.fileName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {entry.timestamp} | Voice: {entry.voice} | Lang: {entry.language.split('-')[0]} | Speed: {entry.speed}x | Pitch: {entry.pitch}
                </p>
              </div>
              <button
                onClick={() => removeHistoryEntry(entry.id)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-800 transition-colors duration-200"
                aria-label={`Remove ${entry.fileName} from history`}
              >
                <FaTrash className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HistoryList;
