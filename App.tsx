import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse, Modality } from '@google/genai';
import { decodeAudioData, createWavBlob, decode } from './services/audioService'; // `decode` moved from local to audioService
import { extractTextFromPdf } from './services/pdfService';
import { HistoryEntry, VoiceConfig, Language } from './types';
import FileUploadAndTextarea from './components/FileUploadAndTextarea';
import TextPreview from './components/TextPreview';
import VoiceSettings from './components/VoiceSettings';
import AudioPlayer from './components/AudioPlayer';
import HistoryList from './components/HistoryList';
import Button from './components/Button';
import Loader from './components/Loader';
import { VOICE_OPTIONS, DEFAULT_VOICE_CONFIG, LANGUAGE_OPTIONS, MAX_CHAPTER_LENGTH } from './constants';

// Add webkitAudioContext to the global Window interface for compatibility
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [cleanedText, setCleanedText] = useState<string>('');
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(DEFAULT_VOICE_CONFIG);
  const [audioBlobs, setAudioBlobs] = useState<Blob[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext on first interaction
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }
  }, []);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('podcast_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('podcast_history', JSON.stringify(history));
  }, [history]);

  // Handle file or text input change
  useEffect(() => {
    if (file) {
      handleFileUpload(file);
    } else if (pastedText) {
      setExtractedText(pastedText);
    } else {
      setExtractedText('');
      setCleanedText('');
      setAudioBlobs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, pastedText]); // Only re-run when file or pastedText changes

  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    setLoading(true);
    setError(null);
    try {
      let text = '';
      if (uploadedFile.type === 'application/pdf') {
        text = await extractTextFromPdf(uploadedFile);
      } else if (uploadedFile.type === 'text/plain') {
        text = await uploadedFile.text();
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or plain text file.');
      }
      setExtractedText(text);
    } catch (err: any) {
      setError(`Error processing file: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const cleanAndSummarizeText = useCallback(async (text: string): Promise<string> => {
    // Check for API key before creating GoogleGenAI instance
    if (!process.env.API_KEY) {
      throw new Error('Gemini API Key is not configured. Please set process.env.API_KEY.');
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash';

    // Simple chunking for very long documents to avoid API limits during cleanup
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += MAX_CHAPTER_LENGTH * 2) { // Use larger chunk for cleanup prompt
      chunks.push(text.substring(i, i + MAX_CHAPTER_LENGTH * 2));
    }

    let cleanedFullText = '';
    for (const chunk of chunks) {
      const prompt = `You are an expert document cleaner. Your task is to extract the main content from the following text, removing any headers, footers, page numbers, and irrelevant boilerplate text. Focus on the core narrative or information. Provide only the cleaned text.\n\nText:\n${chunk}`;
      try {
        const response: GenerateContentResponse = await ai.models.generateContent({
          model: model,
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            // Adjust thinking budget if needed for complex documents
            thinkingConfig: { thinkingBudget: 0 } // Prioritize speed for cleanup
          }
        });
        if (response.text) {
          cleanedFullText += response.text.trim() + '\n\n';
        } else if (response.candidates?.[0]?.finishReason === 'SAFETY') {
          throw new Error('Text cleanup failed due to safety concerns. Please review your content.');
        } else {
          console.warn('Gemini cleanup returned empty text or no candidate:', response);
        }
      } catch (chunkError: any) {
        console.error('Error cleaning text chunk:', chunkError);
        // Continue with other chunks, but log the error
      }
    }

    return cleanedFullText.trim();
  }, []); // Empty dependency array means this function is created once

  const generateSpeech = useCallback(async (text: string, config: VoiceConfig): Promise<Uint8Array | null> => {
    // Check for API key before creating GoogleGenAI instance
    if (!process.env.API_KEY) {
      throw new Error('Gemini API Key is not configured. Please set process.env.API_KEY.');
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-2.5-flash-preview-tts";

    // IMPORTANT: Removed languageHint. TTS models typically do not interpret
    // embedded textual instructions for language switching.
    // The model will attempt to synthesize the provided text based on its
    // inherent language capabilities and the chosen voice.
    const fullTextToSpeak = text; 

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: [{ parts: [{ text: fullTextToSpeak }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            // Removed speakingRate, pitch, and languageCode as they are not explicitly
            // shown as supported in the `gemini-2.5-flash-preview-tts` API guidelines
            // for `ai.models.generateContent`.
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: config.voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return decode(base64Audio); // `decode` is defined in audioService
      }
      return null;
    } catch (err: any) {
      console.error('Error generating speech:', err);
      throw new Error(`Failed to generate speech: ${err.message}`);
    }
  }, []); // Empty dependency array means this function is created once

  const handleConvert = useCallback(async () => {
    if (!extractedText && !pastedText) {
      setError('Please upload a file or paste some text.');
      return;
    }
    setLoading(true);
    setError(null);
    setAudioBlobs([]); // Clear previous audio

    try {
      const textToClean = extractedText || pastedText;
      const cleaned = await cleanAndSummarizeText(textToClean);
      setCleanedText(cleaned);

      if (!cleaned) {
        setError('No meaningful text extracted after cleanup. Please check your input.');
        setLoading(false);
        return;
      }

      // Split cleaned text into chapters for TTS
      const chapters: string[] = [];
      let currentChapter = '';
      const sentences = cleaned.split(/(?<=[.!?])\s+/); // Split by sentence endings

      for (const sentence of sentences) {
        if ((currentChapter + sentence).length <= MAX_CHAPTER_LENGTH) {
          currentChapter += (currentChapter ? ' ' : '') + sentence;
        } else {
          if (currentChapter) {
            chapters.push(currentChapter);
          }
          currentChapter = sentence;
        }
      }
      if (currentChapter) {
        chapters.push(currentChapter);
      }

      const generatedBlobs: Blob[] = [];
      for (let i = 0; i < chapters.length; i++) {
        const chapterText = chapters[i];
        if (!chapterText.trim()) continue; // Skip empty chapters

        // Add a delay between API calls to avoid rate limits
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const pcmData = await generateSpeech(chapterText, voiceConfig);
        if (pcmData && audioContextRef.current) {
          // Decode PCM to AudioBuffer to get WAV properties
          const audioBuffer = await decodeAudioData(pcmData, audioContextRef.current, 24000, 1);
          const wavBlob = createWavBlob(audioBuffer);
          generatedBlobs.push(wavBlob);
        }
      }

      setAudioBlobs(generatedBlobs);

      // Add to history
      const newHistoryEntry: HistoryEntry = {
        id: Date.now(),
        fileName: file?.name || 'Pasted Notes',
        timestamp: new Date().toLocaleString(),
        voice: voiceConfig.voiceName,
        language: voiceConfig.language,
        speed: voiceConfig.speed,
        pitch: voiceConfig.pitch,
        // In a real app, audio might be stored or linked here,
        // but for a purely browser-side app with large audio files,
        // we only store metadata in history.
      };
      setHistory((prevHistory) => [newHistoryEntry, ...prevHistory]);

    } catch (err: any) {
      console.error('Conversion error:', err);
      setError(`Conversion failed: ${err.message}. Make sure your API key is valid.`);
    } finally {
      setLoading(false);
    }
  }, [extractedText, pastedText, voiceConfig, cleanAndSummarizeText, generateSpeech, audioContextRef, file]);

  return (
    <div className="flex flex-col flex-grow p-4 md:p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-indigo-700 dark:text-indigo-400">
        PDF/Notes to Podcast Converter
      </h1>

      {error && (
        <div className="bg-red-500 text-white p-4 rounded-md mb-6 text-center shadow-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
        {/* Input and Settings Column */}
        <div className="lg:col-span-1 flex flex-col space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
          <FileUploadAndTextarea
            onFileChange={setFile}
            onTextChange={setPastedText}
            currentFile={file}
            currentText={pastedText}
            resetInput={() => { setFile(null); setPastedText(''); }}
          />

          <VoiceSettings
            voiceConfig={voiceConfig}
            onVoiceConfigChange={setVoiceConfig}
            voiceOptions={VOICE_OPTIONS}
            languageOptions={LANGUAGE_OPTIONS}
          />

          <Button
            onClick={handleConvert}
            disabled={loading || (!extractedText && !pastedText)}
            className="w-full py-3 text-lg"
          >
            {loading ? <Loader /> : 'Convert to Podcast'}
          </Button>
        </div>

        {/* Preview and Player Column */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          <TextPreview text={extractedText || pastedText || 'Upload a file or paste text to see the preview.'} cleanedText={cleanedText} loading={loading} />

          {audioBlobs.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
              <h2 className="text-2xl font-semibold mb-4 text-indigo-600 dark:text-indigo-300">Podcast Player</h2>
              <AudioPlayer audioBlobs={audioBlobs} fileName={file?.name || 'Pasted Notes'} />
            </div>
          )}
        </div>
      </div>

      {/* History Section - Always visible below other sections on smaller screens, or its own section */}
      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
        <HistoryList history={history} />
      </div>

      <footer className="mt-8 text-center text-gray-600 dark:text-gray-400 text-sm">
        Powered by Google Gemini API. Ensure your API key is configured.
        <p className="mt-2">
          For Veo/Imagen models or high-volume usage, a paid GCP project API key might be required.
          More info: <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline dark:text-indigo-400">Gemini API Billing</a>
        </p>
      </footer>
    </div>
  );
}

export default App;