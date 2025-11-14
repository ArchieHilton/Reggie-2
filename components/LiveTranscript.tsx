import React from 'react';

interface LiveTranscriptProps {
  transcript: string;
}

const LiveTranscript: React.FC<LiveTranscriptProps> = ({ transcript }) => {
  return (
    <div className="w-full px-4 pb-2 text-center text-cyan-400 h-8" aria-live="polite">
      <p className="truncate italic">{transcript || '...'}</p>
    </div>
  );
};

export default LiveTranscript;
