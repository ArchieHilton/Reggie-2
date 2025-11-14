
import React, { useState } from 'react';

interface ApiKeyModalProps {
  onSave: (apiKey: string) => boolean;
  error: string | null;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, error }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSaveClick = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 text-cyan-200 font-mono">
      <div className="bg-gray-900 border border-cyan-700 rounded-lg shadow-xl shadow-cyan-900/50 p-8 w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold tracking-wider text-center">R.E.G.G.I.E. Activation</h2>
        <p className="text-sm text-cyan-300 text-center">
          To begin, please provide your Google AI Gemini API key. Your key is stored securely in your browser and is never sent anywhere else.
        </p>
        
        <div>
            <label htmlFor="api-key-input" className="block mb-2 text-xs font-medium text-cyan-400 uppercase tracking-wider">
              Gemini API Key
            </label>
            <input
              id="api-key-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key here..."
              className="w-full bg-gray-800/70 border border-cyan-700 rounded-md px-4 py-2 text-cyan-200 placeholder-cyan-600/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>

        <div className="flex flex-col items-center space-y-4">
            <button
                onClick={handleSaveClick}
                disabled={!apiKey.trim()}
                className="w-full bg-cyan-600 text-black rounded-md px-4 py-2 font-bold hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400"
            >
                Activate Reggie
            </button>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline">
                Don't have a key? Get one here.
            </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
