import React, { useCallback, useRef } from 'react';
import Button from './Button';

interface FileUploadAndTextareaProps {
  onFileChange: (file: File | null) => void;
  onTextChange: (text: string) => void;
  currentFile: File | null;
  currentText: string;
  resetInput: () => void;
}

const FileUploadAndTextarea: React.FC<FileUploadAndTextareaProps> = ({
  onFileChange,
  onTextChange,
  currentFile,
  currentText,
  resetInput,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      onFileChange(file);
      onTextChange(''); // Clear pasted text if file is dropped
    }
  }, [onFileChange, onTextChange]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      onFileChange(file);
      onTextChange(''); // Clear pasted text if file is selected
    } else {
      onFileChange(null);
    }
  }, [onFileChange, onTextChange]);

  const handleTextareaChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(event.target.value);
    if (event.target.value && currentFile) {
      onFileChange(null); // Clear file if text is pasted
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input visually
      }
    }
  }, [onTextChange, onFileChange, currentFile]);

  const handleReset = useCallback(() => {
    resetInput();
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input visually
    }
  }, [resetInput]);

  return (
    <div className="flex flex-col space-y-4">
      <h2 className="text-2xl font-semibold text-indigo-600 dark:text-indigo-300">Input Text</h2>

      {/* File Upload Section */}
      <div
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-300 transition-colors duration-200"
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".pdf,.txt"
          className="hidden"
        />
        <p className="text-gray-500 dark:text-gray-400">Drag & drop PDF/TXT or click to upload</p>
        {currentFile && (
          <p className="mt-2 text-indigo-600 dark:text-indigo-300 font-medium">Selected: {currentFile.name}</p>
        )}
      </div>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
        <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400">OR</span>
        <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
      </div>

      {/* Text Area Section */}
      <textarea
        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-y min-h-[150px]"
        placeholder="Paste your notes here..."
        value={currentText}
        onChange={handleTextareaChange}
      ></textarea>

      {(currentFile || currentText) && (
        <Button onClick={handleReset} className="w-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700">
          Clear Input
        </Button>
      )}
    </div>
  );
};

export default FileUploadAndTextarea;
