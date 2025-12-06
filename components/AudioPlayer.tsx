import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaPlay, FaPause, FaForward, FaBackward, FaVolumeUp, FaVolumeMute, FaDownload } from 'react-icons/fa';

interface AudioPlayerProps {
  audioBlobs: Blob[];
  fileName: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBlobs, fileName }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Effect to load the current chapter's audio
  useEffect(() => {
    if (audioRef.current && audioBlobs.length > 0) {
      const currentBlob = audioBlobs[currentChapterIndex];
      const objectURL = URL.createObjectURL(currentBlob);
      audioRef.current.src = objectURL;
      audioRef.current.load(); // Load the new audio source

      // Clean up previous object URL when changing chapters
      return () => {
        if (audioRef.current?.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      };
    }
  }, [audioBlobs, currentChapterIndex]);

  // Handle playing state and audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    const onEnded = () => {
      // If there's a next chapter, move to it and play
      if (currentChapterIndex < audioBlobs.length - 1) {
        setCurrentChapterIndex((prev) => prev + 1);
        setIsPlaying(true); // Keep playing
      } else {
        // Last chapter ended
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration || 0);
      if (isPlaying) {
        audio.play(); // Auto-play if was already playing (e.g., after chapter change)
      }
    });

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('loadedmetadata', () => {});
    };
  }, [currentChapterIndex, audioBlobs.length, isPlaying]);

  // Play/Pause toggler
  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(e => console.error("Error playing audio:", e));
      }
    }
  }, [isPlaying]);

  // Seek audio
  const handleSeek = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = parseFloat(event.target.value);
      setCurrentTime(audio.currentTime);
    }
  }, []);

  // Format time for display
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Skip forward 15 seconds
  const skipForward = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.min(audio.currentTime + 15, duration);
    }
  }, [duration]);

  // Skip backward 15 seconds
  const skipBackward = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.max(audio.currentTime - 15, 0);
    }
  }, []);

  // Handle volume change
  const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (audio) {
      const newVolume = parseFloat(event.target.value);
      audio.volume = newVolume;
      setVolume(newVolume);
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
      } else if (newVolume === 0 && !isMuted) {
        setIsMuted(true);
      }
    }
  }, [isMuted]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !audio.muted;
      setIsMuted(audio.muted);
    }
  }, []);

  // Navigate to next chapter
  const nextChapter = useCallback(() => {
    if (currentChapterIndex < audioBlobs.length - 1) {
      setCurrentChapterIndex((prev) => prev + 1);
      setIsPlaying(true); // Automatically play next chapter
    }
  }, [currentChapterIndex, audioBlobs.length]);

  // Navigate to previous chapter
  const prevChapter = useCallback(() => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex((prev) => prev - 1);
      setIsPlaying(true); // Automatically play previous chapter
    }
  }, [currentChapterIndex]);

  // Download current chapter as a WAV file
  const handleDownloadCurrentChapter = useCallback(() => {
    if (audioBlobs.length === 0) return;

    const currentBlob = audioBlobs[currentChapterIndex];
    const url = URL.createObjectURL(currentBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.[^/.]+$/, "")}_chapter_${currentChapterIndex + 1}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [audioBlobs, currentChapterIndex, fileName]);

  return (
    <div className="flex flex-col space-y-4">
      <audio ref={audioRef} preload="auto"></audio>

      <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
        <span>Chapter {currentChapterIndex + 1} / {audioBlobs.length}</span>
        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>

      {/* Progress Bar */}
      <input
        type="range"
        min="0"
        max={duration || 0}
        value={currentTime}
        onChange={handleSeek}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600 dark:accent-indigo-400"
      />

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={prevChapter}
          disabled={currentChapterIndex === 0}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous Chapter"
        >
          <FaBackward className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
        <button
          onClick={skipBackward}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
          aria-label="Rewind 15 seconds"
        >
          <FaBackward className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          <span className="sr-only">Rewind 15 seconds</span>
        </button>
        <button
          onClick={togglePlayPause}
          className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors duration-200 text-white"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <FaPause className="w-6 h-6" />
          ) : (
            <FaPlay className="w-6 h-6" />
          )}
        </button>
        <button
          onClick={skipForward}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
          aria-label="Forward 15 seconds"
        >
          <FaForward className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          <span className="sr-only">Forward 15 seconds</span>
        </button>
        <button
          onClick={nextChapter}
          disabled={currentChapterIndex === audioBlobs.length - 1}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next Chapter"
        >
          <FaForward className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
      </div>

      {/* Volume and Download */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2 w-1/3">
          <button
            onClick={toggleMute}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <FaVolumeMute className="w-5 h-5 text-gray-700 dark:text-gray-200" /> : <FaVolumeUp className="w-5 h-5 text-gray-700 dark:text-gray-200" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600 dark:accent-indigo-400"
            aria-label="Volume"
          />
        </div>

        {audioBlobs.length > 0 && (
          <button
            onClick={handleDownloadCurrentChapter}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-md transition-colors duration-200"
            aria-label="Download Current Chapter as WAV"
          >
            <FaDownload className="w-5 h-5" />
            <span>Download Chapter (WAV)</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;