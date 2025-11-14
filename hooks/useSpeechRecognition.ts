import { useState, useEffect, useRef, useCallback } from 'react';

// Fix: Add type definitions for the experimental Web Speech API to resolve TypeScript errors.
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
  readonly error: string;
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


// FIX: Cast `window` to `any` to access experimental browser APIs without TypeScript errors.
// The constant is renamed to `SpeechRecognitionImpl` to avoid shadowing the global `SpeechRecognition` type.
const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useSpeechRecognition = (onResult: (finalTranscript: string, interimTranscript: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const stoppedManuallyRef = useRef(false);

  // Use a ref to hold the latest onResult callback.
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  
  // This effect sets up and tears down the recognition object. Runs only once.
  useEffect(() => {
    if (!SpeechRecognitionImpl) {
      console.error("Speech Recognition API not supported in this browser.");
      return;
    }
    
    const recognition: SpeechRecognition = new SpeechRecognitionImpl();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        setIsListening(true);
        stoppedManuallyRef.current = false;
    };
    
    recognition.onend = () => {
      setIsListening(false);
      // Automatically restart if it wasn't stopped manually and not unmounting.
      if (!stoppedManuallyRef.current) {
        setTimeout(() => {
            // Check again in case stop was called during the timeout
            if (recognitionRef.current && !stoppedManuallyRef.current) {
                try {
                    recognitionRef.current.start();
                } catch(e) {
                    // This can happen if start() is called while it's still in the process of stopping.
                    console.warn("Could not restart speech recognition (may already be starting).", e);
                }
            }
        }, 250);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      // If the user denies permission, don't try to restart.
      if (event.error === 'not-allowed') {
          stoppedManuallyRef.current = true;
      }
      // onend is usually called after an error, which will handle restart logic.
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
        // Remove listeners to prevent memory leaks and unwanted restarts
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
        stoppedManuallyRef.current = false;
        recognitionRef.current.start();
      } catch (error) {
        console.warn("Speech recognition could not start (it may be starting already).", error);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      stoppedManuallyRef.current = true;
      recognitionRef.current.stop();
    }
  }, []);

  return { isListening, startListening, stopListening };
};
