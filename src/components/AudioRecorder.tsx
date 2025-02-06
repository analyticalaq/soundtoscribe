import React, { useState, useRef } from 'react';
import { Key } from 'lucide-react';
import { toast } from 'sonner';
import { HfInference } from '@huggingface/inference';
import { Button } from './ui/button';
import AudioVisualizer from './AudioVisualizer';
import ApiKeyInput from './audio/ApiKeyInput';
import RecordingControls from './audio/RecordingControls';
import TranslationControls from './audio/TranslationControls';
import TranscriptionOutput from './audio/TranscriptionOutput';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [transcription, setTranscription] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inferenceClientRef = useRef<HfInference | null>(null);

  const initInferenceClient = () => {
    if (!inferenceClientRef.current && apiKey) {
      inferenceClientRef.current = new HfInference(apiKey);
    }
  };

  const translateText = async (text: string, targetLang: string) => {
    if (!apiKey) {
      toast.error('Please enter your Hugging Face API key first');
      setShowApiKeyInput(true);
      return;
    }

    try {
      setIsTranslating(true);
      initInferenceClient();
      
      if (!inferenceClientRef.current) {
        throw new Error('Inference client not initialized');
      }

      // Use T5 model for translation
      const model = 't5-base';
      console.log('Using translation model:', model);
      
      // Format input for T5
      const formattedInput = `translate English to ${targetLang}: ${text}`;
      
      const translationResult = await inferenceClientRef.current.textGeneration({
        model: model,
        inputs: formattedInput,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.7
        }
      });

      console.log('Translation result:', translationResult);

      if (typeof translationResult === 'string') {
        setTranscription(translationResult);
        toast.success('Translation completed');
      } else if (translationResult && 'generated_text' in translationResult) {
        setTranscription(translationResult.generated_text);
        toast.success('Translation completed');
      } else {
        throw new Error('Unexpected translation response format');
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate text. Please check your API key and try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    setTargetLanguage(newLanguage);
    if (transcription && newLanguage !== 'en') {
      await translateText(transcription, newLanguage);
    }
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

      const result = await inferenceClientRef.current.automaticSpeechRecognition({
        data: audioBlob,
        model: "openai/whisper-large-v3-turbo",
      });

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
        <ApiKeyInput
          apiKey={apiKey}
          setApiKey={setApiKey}
          setShowApiKeyInput={setShowApiKeyInput}
          initInferenceClient={initInferenceClient}
        />
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

      <RecordingControls
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
        triggerFileUpload={triggerFileUpload}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        isTranscribing={isTranscribing}
        apiKey={apiKey}
      />

      {isRecording && (
        <AudioVisualizer audioStream={audioStream} isRecording={isRecording} />
      )}

      {transcription && (
        <>
          <TranslationControls
            targetLanguage={targetLanguage}
            handleLanguageChange={handleLanguageChange}
          />
          <TranscriptionOutput
            transcription={transcription}
            isTranslating={isTranslating}
            copyToClipboard={copyToClipboard}
            isCopied={isCopied}
          />
        </>
      )}
    </div>
  );
};

export default AudioRecorder;