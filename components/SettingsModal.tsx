
import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voices: SpeechSynthesisVoice[];
  selectedVoiceURI: string | null;
  onVoiceChange: (voiceURI: string) => void;
  apiKey: string | null;
  onApiKeyChange: (apiKey: string) => boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, voices, selectedVoiceURI, onVoiceChange, apiKey, onApiKeyChange }) => {
  const [currentApiKey, setCurrentApiKey] = useState(apiKey || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    setCurrentApiKey(apiKey || '');
  }, [apiKey, isOpen]);

  if (!isOpen) {
    return null;
  }
  
  const handleApiKeySave = () => {
      const success = onApiKeyChange(currentApiKey);
      if (success) {
          setSaveStatus('success');
      } else {
          setSaveStatus('error');
      }
      setTimeout(() => setSaveStatus('idle'), 2000);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div 
        className="bg-gray-900 border border-cyan-700 rounded-lg shadow-xl shadow-cyan-900/50 p-6 w-full max-w-md text-cyan-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="settings-title" className="text-2xl font-bold tracking-wider">Settings</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-cyan-800" aria-label="Close settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="voice-select" className="block mb-2 text-sm font-medium text-cyan-400">
              Assistant Voice
            </label>
            <select
              id="voice-select"
              value={selectedVoiceURI ?? ''}
              onChange={(e) => onVoiceChange(e.target.value)}
              className="bg-gray-800 border border-cyan-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5"
            >
              {voices.length === 0 ? (
                <option disabled>Loading voices...</option>
              ) : (
                voices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label htmlFor="api-key-input" className="block mb-2 text-sm font-medium text-cyan-400">
              Gemini API Key
            </label>
            <div className="flex items-center space-x-2">
                <input
                  id="api-key-input"
                  type="password"
                  value={currentApiKey}
                  onChange={(e) => setCurrentApiKey(e.target.value)}
                  className="flex-grow bg-gray-800 border border-cyan-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5"
                />
                <button
                    onClick={handleApiKeySave}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        saveStatus === 'success' ? 'bg-green-600' :
                        saveStatus === 'error' ? 'bg-red-600' :
                        'bg-cyan-600 hover:bg-cyan-500'
                    }`}
                >
                    {saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Invalid' : 'Save'}
                </button>
            </div>
            <p className="mt-2 text-xs text-gray-400">Your key is stored only in your browser's local storage.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
