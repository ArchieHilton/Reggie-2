import React from 'react';
import type { AssistantStatus } from '../types';

interface StatusIndicatorProps {
  status: AssistantStatus;
  isListening: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, isListening }) => {
  const getStatusText = () => {
    if (!isListening) {
      return 'Tap to Activate';
    }
    switch (status) {
      case 'listening':
        return 'Listening...';
      case 'thinking':
        return 'Thinking...';
      case 'speaking':
        return 'Speaking...';
      case 'idle':
      default:
        return 'Say "Hey Reggie"';
    }
  };

  const ringClasses = "absolute rounded-full border-2 border-cyan-500 opacity-70";

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Animated Rings */}
      <div className={`${ringClasses} w-full h-full ${isListening ? (status === 'listening' || status === 'speaking' ? 'animate-ping' : 'animate-pulse') : ''}`} style={{ animationDuration: '2s' }}></div>
      <div className={`${ringClasses} w-48 h-48 ${isListening ? (status === 'thinking' ? 'animate-spin' : 'animate-pulse') : ''}`} style={{ animationDuration: '3s' }}></div>
      <div className={`${ringClasses} w-32 h-32 ${isListening ? 'animate-pulse' : ''}`} style={{ animationDuration: '2.5s' }}></div>
      
      {/* Central Orb */}
      <div className="absolute w-24 h-24 bg-cyan-700 rounded-full shadow-lg shadow-cyan-500/50 flex items-center justify-center">
         <div className="w-20 h-20 bg-cyan-500 rounded-full shadow-inner"></div>
      </div>
      
      <div className="absolute text-center text-cyan-200">
        <p className="text-lg font-bold tracking-widest uppercase">{getStatusText()}</p>
      </div>
    </div>
  );
};

export default StatusIndicator;