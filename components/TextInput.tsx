
import React, { useState } from 'react';

interface TextInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

const TextInput: React.FC<TextInputProps> = ({ onSendMessage, disabled }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full p-4 flex items-center space-x-2 bg-black/50 border-t border-cyan-900/50">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={disabled ? "Reggie is processing..." : "Type your message..."}
        disabled={disabled}
        className="flex-grow bg-gray-900/70 border border-cyan-700 rounded-full px-4 py-2 text-cyan-200 placeholder-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
      <button
        type="submit"
        disabled={disabled}
        className="bg-cyan-600 text-black rounded-full p-2 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
      </button>
    </form>
  );
};

export default TextInput;
