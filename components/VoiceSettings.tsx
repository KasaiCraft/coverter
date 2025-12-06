import React, { useCallback } from 'react';
import { VoiceConfig, Language } from '../types';
// Removed import for `PrebuiltVoiceName` as it's not directly exported by @google/genai

interface VoiceSettingsProps {
  voiceConfig: VoiceConfig;
  onVoiceConfigChange: (config: VoiceConfig) => void;
  voiceOptions: { label: string; value: string }[]; // Changed value type from PrebuiltVoiceName to string
  languageOptions: { label: string; value: Language }[];
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  voiceConfig,
  onVoiceConfigChange,
  voiceOptions,
  languageOptions,
}) => {
  const handleVoiceChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    onVoiceConfigChange({ ...voiceConfig, voiceName: event.target.value }); // Value is already a string
  }, [voiceConfig, onVoiceConfigChange]);

  const handleLanguageChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    onVoiceConfigChange({ ...voiceConfig, language: event.target.value as Language });
  }, [voiceConfig, onVoiceConfigChange]);

  const handleSpeedChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onVoiceConfigChange({ ...voiceConfig, speed: parseFloat(event.target.value) });
  }, [voiceConfig, onVoiceConfigChange]);

  const handlePitchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onVoiceConfigChange({ ...voiceConfig, pitch: parseFloat(event.target.value) });
  }, [voiceConfig, onVoiceConfigChange]);

  return (
    <div className="flex flex-col space-y-4">
      <h2 className="text-2xl font-semibold text-indigo-600 dark:text-indigo-300">Voice Settings</h2>

      {/* Voice Selection */}
      <div>
        <label htmlFor="voiceSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Voice Style
        </label>
        <select
          id="voiceSelect"
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          value={voiceConfig.voiceName}
          onChange={handleVoiceChange}
        >
          {voiceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Language Selection */}
      <div>
        <label htmlFor="languageSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Language
        </label>
        <select
          id="languageSelect"
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          value={voiceConfig.language}
          onChange={handleLanguageChange}
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Note: Hindi support is experimental and results may vary.
        </p>
      </div>

      {/* Speed Slider */}
      <div>
        <label htmlFor="speedSlider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Speed: {voiceConfig.speed.toFixed(1)}x
        </label>
        <input
          type="range"
          id="speedSlider"
          min="0.5"
          max="2.0"
          step="0.1"
          value={voiceConfig.speed}
          onChange={handleSpeedChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600 dark:accent-indigo-400"
        />
      </div>

      {/* Pitch Slider */}
      <div>
        <label htmlFor="pitchSlider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Pitch: {voiceConfig.pitch.toFixed(1)}
        </label>
        <input
          type="range"
          id="pitchSlider"
          min="-20"
          max="20"
          step="1"
          value={voiceConfig.pitch}
          onChange={handlePitchChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600 dark:accent-indigo-400"
        />
      </div>
    </div>
  );
};

export default VoiceSettings;