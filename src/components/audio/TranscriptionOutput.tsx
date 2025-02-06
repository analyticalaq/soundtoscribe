import React from 'react';
import { Copy, Check } from 'lucide-react';

interface TranscriptionOutputProps {
  transcription: string;
  isTranslating: boolean;
  copyToClipboard: () => void;
  isCopied: boolean;
}

const TranscriptionOutput = ({
  transcription,
  isTranslating,
  copyToClipboard,
  isCopied,
}: TranscriptionOutputProps) => {
  if (!transcription) return null;

  return (
    <div className="mt-8 space-y-4 animate-slide-up">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-neutral-800">
          {isTranslating ? 'Translating...' : 'Transcription'}
        </h3>
        <button
          onClick={copyToClipboard}
          className="flex items-center space-x-2 text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
        >
          {isCopied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          <span>{isCopied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <p className="text-neutral-700 leading-relaxed">{transcription}</p>
      </div>
    </div>
  );
};

export default TranscriptionOutput;