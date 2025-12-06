// The `PrebuiltVoiceName` enum is not directly exported by `@google/genai` in the current version.
// Voice names are passed as string literals to the API.

// Enum for supported languages
export enum Language {
  ENGLISH = 'en-US',
  HINDI = 'hi-IN',
}

// Interface for voice configuration
export interface VoiceConfig {
  voiceName: string; // Changed from PrebuiltVoiceName to string
  speed: number;
  pitch: number;
  language: Language;
}

// Interface for conversion history entries
export interface HistoryEntry {
  id: number;
  fileName: string;
  timestamp: string;
  voice: string; // Changed from PrebuiltVoiceName to string
  language: Language;
  speed: number;
  pitch: number;
  // In a real app, audio might be stored or linked here,
  // but for a purely browser-side app with large audio files,
  // we only store metadata in history.
}