import { useState, useEffect, useRef, useCallback } from 'react';

// Type definitions for the experimental Web Speech API
interface SpeechRecognitionAlternative {
  readonly transcript: string;
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly[index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: any; 
  readonly message?: string;
}
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    start: () => void;
    stop: () => void;
}

const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useSpeechRecognition = (onResult: (finalTranscript: string, interimTranscript: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const stoppedManuallyRef = useRef(false);
  const lastErrorRef = useRef<string | null>(null);

  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  
  // This effect sets up and tears down the recognition object. Runs only once.
  useEffect(() => {
    if (!SpeechRecognitionImpl) {
      setError("Speech Recognition API not supported in this browser.");
      return;
    }
    
    const recognition: SpeechRecognition = new SpeechRecognitionImpl();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        lastErrorRef.current = null;
        stoppedManuallyRef.current = false;
    };
    
    recognition.onend = () => {
      setIsListening(false);
      // Automatically restart unless it was stopped manually or a fatal error occurred.
      if (!stoppedManuallyRef.current && lastErrorRef.current !== 'not-allowed' && lastErrorRef.current !== 'audio-capture') {
        setTimeout(() => {
            if (recognitionRef.current && !stoppedManuallyRef.current) {
                try {
                    recognitionRef.current.start();
                } catch(e) {
                    console.warn("Could not restart speech recognition (may already be starting).", e);
                }
            }
        }, 500); // Increased delay for stability
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error event:', event);
      let errorMessage = "An unknown error occurred with speech recognition.";
      
      const errorType = event.error || 'unknown';
      lastErrorRef.current = errorType;

      switch(errorType) {
          case 'no-speech':
            // This is not a fatal error, we can just let it restart.
            errorMessage = null; // No need to show an error for silence.
            break;
          case 'audio-capture':
            errorMessage = "Reggie can't hear you. No audio is being captured. Please check your microphone hardware.";
            stoppedManuallyRef.current = true; // Fatal error, don't restart.
            break;
          case 'not-allowed':
            errorMessage = "Microphone permission was denied. Please enable it in your browser settings to use voice commands.";
            stoppedManuallyRef.current = true; // Fatal error, don't restart.
            break;
           case 'network':
            errorMessage = "A network error occurred. Speech recognition may be unavailable.";
            break; // Non-fatal, will attempt to restart.
          default:
            errorMessage = `An error occurred: ${event.error}. Please try again.`
      }

      if(errorMessage) {
        setError(errorMessage);
      }
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      onResultRef.current(finalTranscript.trim(), interimTranscript.trim());
    };
    
    // Cleanup on component unmount
    return () => {
      stoppedManuallyRef.current = true;
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once.

  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListeningRef.current) {
      try {
        setError(null);
        lastErrorRef.current = null;
        stoppedManuallyRef.current = false;
        recognitionRef.current.start();
      } catch (error) {
        console.warn("Speech recognition could not start.", error);
        setError("Could not start listening. Please check your browser's console for details.");
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      stoppedManuallyRef.current = true;
      recognitionRef.current.stop();
    }
  }, []);

  return { isListening, error, startListening, stopListening };
};