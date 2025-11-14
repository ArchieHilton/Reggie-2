import { useState, useCallback, useEffect } from 'react';

export const useSpeechSynthesis = (onEnd: () => void) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string, voiceURI: string | null) => {
    if (!window.speechSynthesis) {
      console.warn("Speech Synthesis not supported.");
      onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    if (voiceURI) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.voiceURI === voiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd();
    };
    utterance.onerror = () => {
        setIsSpeaking(false);
        onEnd();
    };
    window.speechSynthesis.speak(utterance);
  }, [onEnd]);
  
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { isSpeaking, speak };
};