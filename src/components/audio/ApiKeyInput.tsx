import React from 'react';
import { Key } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface ApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  setShowApiKeyInput: (show: boolean) => void;
  initInferenceClient: () => void;
}

const ApiKeyInput = ({ apiKey, setApiKey, setShowApiKeyInput, initInferenceClient }: ApiKeyInputProps) => {
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

  return (
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
  );
};

export default ApiKeyInput;