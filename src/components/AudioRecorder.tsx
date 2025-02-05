
import React, { useState, useRef } from 'react';
import { Mic, Square, Copy, Check, Upload, Key, Languages } from 'lucide-react';
import { toast } from 'sonner';
import { HfInference } from '@huggingface/inference';
import AudioVisualizer from './AudioVisualizer';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface TranslationResponse {
  translation_text: string;
}

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [transcription, setTranscription] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inferenceClientRef = useRef<HfInference | null>(null);

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'French' },
    { value: 'es', label: 'Spanish' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'nl', label: 'Dutch' },
    { value: 'pl', label: 'Polish' },
    { value: 'ru', label: 'Russian' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ar', label: 'Arabic' },
    { value: 'hi', label: 'Hindi' },
  ];

  const initInferenceClient = () => {
    if (!inferenceClientRef.current && apiKey) {
      inferenceClientRef.current = new HfInference(apiKey);
    }
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }
    setShowApiKeyInput(false);
    toast.success('API key saved');
    initInferenceClient();
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    if (!apiKey) {
      toast.error('Please enter your Hugging Face API key first');
      setShowApiKeyInput(true);
      return;
    }

    try {
      setIsTranscribing(true);
      initInferenceClient();
      
      if (!inferenceClientRef.current) {
        throw new Error('Inference client not initialized');
      }

      // First, transcribe the audio in its original language
      const result = await inferenceClientRef.current.automaticSpeechRecognition({
        data: audioBlob,
        model: "openai/whisper-large-v3-turbo",
      });

      // Then, translate the transcription if needed
      if (targetLanguage !== 'en') {
        const translationResult = await inferenceClientRef.current.translation({
          model: `Helsinki-NLP/opus-mt-en-${targetLanguage}`,
          inputs: result.text,
        });

        if (typeof translationResult === 'object' && translationResult !== null && 'translation_text' in translationResult) {
          setTranscription(translationResult.translation_text);
        } else {
          throw new Error('Unexpected translation response format');
        }
      } else {
        // If target language is English, just use the transcription
        setTranscription(result.text);
      }
      
      toast.success('Transcription and translation completed');
    } catch (error) {
      console.error('Transcription/Translation error:', error);
      toast.error('Failed to transcribe and translate audio');
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
      {showApiKeyInput ? (
        <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-neutral-700 mb-2">
                Enter your Hugging Face API Key
              </label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="flex-1"
                />
                <Button type="submit" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Save Key
                </Button>
              </div>
            </div>
            <p className="text-sm text-neutral-600">
              Get your API key from{' '}
              <a
                href="https://huggingface.co/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-DEFAULT hover:text-accent-hover underline"
              >
                Hugging Face Settings
              </a>
            </p>
          </form>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowApiKeyInput(true)}
          className="flex items-center gap-2"
        >
          <Key className="w-4 h-4" />
          Change API Key
        </Button>
      )}

      <div className="flex flex-col items-center space-y-4">
        <div className="w-full max-w-xs mb-4">
          <Select
            value={targetLanguage}
            onValueChange={setTargetLanguage}
          >
            <SelectTrigger className="w-full">
              <Languages className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Translate to" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
            isTranscribing ? 'Transcribing and translating...' :
            isRecording ? 'Recording...' :
            'Click to start recording or upload an audio file'
          }
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
