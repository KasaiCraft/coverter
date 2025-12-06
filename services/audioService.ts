/**
 * Decodes a base64 string into a Uint8Array.
 * This function is manually implemented as per Gemini API guidance.
 * @param base64 The base64 encoded string.
 * @returns A Uint8Array representing the decoded binary data.
 */
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data (Uint8Array) into an AudioBuffer using the AudioContext.
 * This is crucial for understanding audio properties and creating proper WAV headers.
 * @param data The raw PCM audio data as Uint8Array.
 * @param ctx The AudioContext instance.
 * @param sampleRate The sample rate of the audio.
 * @param numChannels The number of audio channels (e.g., 1 for mono).
 * @returns A Promise that resolves to an AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; // Convert Int16 to Float32 normalized to [-1, 1]
    }
  }
  return buffer;
}

/**
 * Creates a WAV audio Blob from an AudioBuffer.
 * This is necessary because Gemini TTS returns raw PCM, not a WAV file.
 * The WAV header is prepended to the PCM data.
 * @param audioBuffer The AudioBuffer containing the audio data.
 * @returns A Blob object representing the WAV audio file.
 */
export function createWavBlob(audioBuffer: AudioBuffer): Blob {
  const numOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM (uncompressed)
  const bitDepth = 16; // 16-bit PCM

  const buffer = new ArrayBuffer(44 + audioBuffer.length * numOfChannels * (bitDepth / 8));
  const view = new DataView(buffer);

  let offset = 0;

  // RIFF chunk descriptor
  writeString(view, offset, 'RIFF'); offset += 4;
  view.setUint32(offset, 36 + audioBuffer.length * numOfChannels * (bitDepth / 8), true); offset += 4;
  writeString(view, offset, 'WAVE'); offset += 4;

  // FMT sub-chunk
  writeString(view, offset, 'fmt '); offset += 4;
  view.setUint32(offset, 16, true); offset += 4; // Subchunk1Size for PCM
  view.setUint16(offset, format, true); offset += 2; // AudioFormat (1 = PCM)
  view.setUint16(offset, numOfChannels, true); offset += 2; // NumChannels
  view.setUint32(offset, sampleRate, true); offset += 4; // SampleRate
  view.setUint32(offset, sampleRate * numOfChannels * (bitDepth / 8), true); offset += 4; // ByteRate
  view.setUint16(offset, numOfChannels * (bitDepth / 8), true); offset += 2; // BlockAlign
  view.setUint16(offset, bitDepth, true); offset += 2; // BitsPerSample

  // Data sub-chunk
  writeString(view, offset, 'data'); offset += 4;
  view.setUint32(offset, audioBuffer.length * numOfChannels * (bitDepth / 8), true); offset += 4; // Subchunk2Size

  // Write PCM samples
  const floatData = audioBuffer.getChannelData(0); // Assuming mono for simplicity
  for (let i = 0; i < floatData.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, floatData[i])); // Clamp to [-1, 1]
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true); // Convert float to 16-bit PCM
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Helper function to write a string to a DataView.
 * @param view The DataView to write to.
 * @param offset The starting offset.
 * @param str The string to write.
 */
function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Converts a Blob to a Base64 string. Useful for displaying images or
 * when Base64 is required for API inputs.
 * @param blob The Blob object to convert.
 * @returns A Promise that resolves to the Base64 string.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the "data:mime/type;base64," prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
