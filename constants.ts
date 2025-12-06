// The `PrebuiltVoiceName` enum is not directly exported by `@google/genai` in the current version.
// Voice names are passed as string literals to the API.
import { Language, VoiceConfig } from './types';

// Default voice configuration
export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  voiceName: 'Kore', // Changed from PrebuiltVoiceName.ZEPHYR to string literal to align with gemini-2.5-flash-preview-tts example
  speed: 1, // Normal speed
  pitch: 0, // Normal pitch
  language: Language.ENGLISH,
};

// Available voice options for selection
export const VOICE_OPTIONS: { label: string; value: string }[] = [ // Changed value type from PrebuiltVoiceName to string
  { label: 'Zephyr (Female)', value: 'Zephyr' },
  { label: 'Kore (Male)', value: 'Kore' },
  { label: 'Puck (Female)', value: 'Puck' },
  { label: 'Charon (Male)', value: 'Charon' },
  { label: 'Fenrir (Male)', value: 'Fenrir' },
];

// Available language options
export const LANGUAGE_OPTIONS: { label: string; value: Language }[] = [
  { label: 'English', value: Language.ENGLISH },
  { label: 'Hindi (Experimental)', value: Language.HINDI }, // Gemini TTS is primarily English, Hindi might be experimental.
];

// Max length of text for each chapter to be sent to TTS, to avoid API limits
// and manage audio chunk sizes.
export const MAX_CHAPTER_LENGTH = 1500; // Characters