import React, { useState, useRef } from 'react';
import { Mic, Square, Copy, Check, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { pipeline } from '@huggingface/transformers';
import AudioVisualizer from './AudioVisualizer';
import { Button } from './ui/button';
import { Input } from './ui/input';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [transcription, setTranscription] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptionPipelineRef = useRef<any>(null);

  const initTranscriptionPipeline = async () => {
    if (!transcriptionPipelineRef.current) {
      try {
        transcriptionPipelineRef.current = await pipeline(
          'automatic-speech-recognition',
          'onnx-community/whisper-tiny.en',
          { device: 'webgpu' }
        );
      } catch (error) {
        console.error('Error initializing transcription pipeline:', error);
        toast.error('Failed to initialize transcription. Please try again.');
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setIsTranscribing(true);
      await initTranscriptionPipeline();
      
      if (!transcriptionPipelineRef.current) {
        throw new Error('Transcription pipeline not initialized');
      }

      const result = await transcriptionPipelineRef.current(audioBlob);
      setTranscription(result.text);
      toast.success('Transcription completed');
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Failed to transcribe audio');
      setTranscription('');
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        
        await transcribeAudio(audioBlob);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('Recording completed');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }

    await transcribeAudio(file);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcription);
      setIsCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-4 rounded-full transition-all duration-200 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-accent-DEFAULT hover:bg-accent-hover'
            }`}
            disabled={isTranscribing}
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
            disabled={isTranscribing}
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
          {isTranscribing 
            ? 'Transcribing...' 
            : isRecording 
              ? 'Recording...' 
              : 'Click to start recording or upload an audio file'}
        </p>
      </div>

      {isRecording && (
        <AudioVisualizer audioStream={audioStream} isRecording={isRecording} />
      )}

      {transcription && (
        <div className="mt-8 space-y-4 animate-slide-up">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-neutral-800">Transcription</h3>
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
      )}
    </div>
  );
};

export default AudioRecorder;