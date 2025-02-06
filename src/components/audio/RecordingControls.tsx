import React from 'react';
import { Mic, Square, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface RecordingControlsProps {
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  triggerFileUpload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isTranscribing: boolean;
  apiKey: string;
}

const RecordingControls = ({
  isRecording,
  startRecording,
  stopRecording,
  triggerFileUpload,
  fileInputRef,
  handleFileUpload,
  isTranscribing,
  apiKey,
}: RecordingControlsProps) => {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex gap-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-4 rounded-full transition-all duration-200 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-accent-DEFAULT hover:bg-accent-hover'
          }`}
          disabled={isTranscribing || !apiKey}
        >
          {isRecording ? (
            <Square className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </button>
        <Button
          onClick={triggerFileUpload}
          variant="outline"
          className="flex items-center gap-2"
          disabled={isTranscribing || !apiKey}
        >
          <Upload className="w-4 h-4" />
          Upload Audio
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
      <p className="text-neutral-600 font-medium">
        {!apiKey ? 'Please enter your API key to start' :
          isTranscribing ? 'Transcribing...' :
          isRecording ? 'Recording...' :
          'Click to start recording or upload an audio file'
        }
      </p>
    </div>
  );
};

export default RecordingControls;