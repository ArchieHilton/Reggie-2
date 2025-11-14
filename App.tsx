import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, AssistantStatus, Timer, ScheduledEvent } from './types';
import { createChatSession, performSearch } from './services/geminiService';
import type { Chat } from '@google/genai';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import StatusIndicator from './components/StatusIndicator';
import ChatLog from './components/ChatLog';
import TextInput from './components/TextInput';
import SettingsModal from './components/SettingsModal';
import ApiKeyModal from './components/ApiKeyModal';
import LiveTranscript from './components/LiveTranscript';


// Base64 encoded beep sound for alerts
const BEEP_SOUND = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' +
                   'JjkJ/z/w/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A' +
                   '/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A';

/**
 * Removes markdown formatting from a string for clean speech synthesis.
 * @param text The text to clean.
 * @returns The cleaned text.
 */
const cleanForSpeech = (text: string): string => {
    return text
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Remove URLs from markdown links, keeping the text
        .replace(/\*\*/g, '') // Remove bold markers
        .replace(/\*/g, '') // Remove asterisks
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
};


const App: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [status, setStatus] = useState<AssistantStatus>('idle');
    const [isAwaitingCommand, setIsAwaitingCommand] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [apiKeyError, setApiKeyError] = useState<string | null>(null);
    const chatRef = useRef<Chat | null>(null);

    const [timers, setTimers] = useState<Timer[]>([]);
    const [events, setEvents] = useState<ScheduledEvent[]>([]);
    const alertAudioRef = useRef<HTMLAudioElement>(null);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
    const wakeLockRef = useRef<any>(null); // For Screen Wake Lock API

    const commandTimerRef = useRef<number | null>(null);
    const fullTranscriptRef = useRef<string>('');

    // Screen Wake Lock Effect
    useEffect(() => {
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                    console.log('Screen Wake Lock is active.');
                    wakeLockRef.current.addEventListener('release', () => {
                        console.log('Screen Wake Lock was released.');
                        wakeLockRef.current = null;
                    });
                } catch (err: any) {
                    console.error(`Could not acquire wake lock: ${err.name}, ${err.message}`);
                }
            } else {
                console.warn('Screen Wake Lock API not supported.');
            }
        };

        const handleVisibilityChange = () => {
            if (wakeLockRef.current === null && document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };

        requestWakeLock();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (wakeLockRef.current !== null) {
                wakeLockRef.current.release();
                wakeLockRef.current = null;
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Load API Key from local storage on initial render
    useEffect(() => {
        const storedKey = localStorage.getItem('gemini-api-key');
        if (storedKey) {
            handleApiKeyUpdate(storedKey);
        }
    }, []);

    const handleApiKeyUpdate = (newKey: string) => {
        try {
            chatRef.current = createChatSession(newKey);
            localStorage.setItem('gemini-api-key', newKey);
            setApiKey(newKey);
            setApiKeyError(null);
            return true;
        } catch (e) {
            console.error("Invalid API Key:", e);
            setApiKeyError('The provided API Key is invalid. Please check it and try again.');
            localStorage.removeItem('gemini-api-key');
            setApiKey(null);
            chatRef.current = null;
            return false;
        }
    };

    const handleSpeechEnd = useCallback(() => {
        if (isAwaitingCommand) {
            setStatus('listening'); // Transition to listening after saying "Yes, Sir?"
        } else {
            setStatus('idle'); // Back to idle after speaking a normal response
        }
    }, [isAwaitingCommand]);

    const { speak } = useSpeechSynthesis(handleSpeechEnd);

    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                setAvailableVoices(voices);
                if (!selectedVoiceURI) {
                    const defaultVoice = voices.find(v => v.name.includes('Google US English')) || voices.find(v => v.lang === 'en-US') || voices[0];
                    if (defaultVoice) {
                        setSelectedVoiceURI(defaultVoice.voiceURI);
                    }
                }
            }
        };
        if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
        loadVoices();
    }, [selectedVoiceURI]);

    const addMessage = (text: string, sender: 'user' | 'reggie') => {
        setMessages(prev => [...prev, { id: Date.now().toString(), text, sender }]);
    };

    const processCommand = useCallback(async (command: string) => {
        if (!command || status === 'thinking' || status === 'speaking' || !chatRef.current) return;
        
        addMessage(command, 'user');
        setStatus('thinking');

        try {
            const result = await chatRef.current.sendMessage({ message: command });
            const responseText = result.text;
            const functionCalls = result.functionCalls;

            if (functionCalls && functionCalls.length > 0) {
                const call = functionCalls[0];
                const { name, args } = call;
                let confirmationText = "I'm not sure how to do that, Sir.";

                if (name === 'setTimer' && args.durationInSeconds) {
                    const newTimer: Timer = {
                        id: Date.now(),
                        label: args.label as string || null,
                        initialDuration: args.durationInSeconds as number,
                        endTime: Date.now() + (args.durationInSeconds as number) * 1000,
                    };
                    setTimers(prev => [...prev, newTimer]);
                    confirmationText = `Okay Sir, I've set a ${args.label ? `${args.label} ` : ''}timer for ${args.durationInSeconds} seconds.`;
                } else if (name === 'getCurrentTime') {
                    const now = new Date();
                    confirmationText = `Sir, the current time is ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
                } else if (name === 'findMusic' && args.query) {
                    const query = args.query as string;
                    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
                    confirmationText = `Of course, Sir. Here is what I found for "${query}":\n[Listen on YouTube](${youtubeUrl})`;
                } else if ((name === 'setAlarm' || name === 'setReminder') && args.time) {
                    const dateStr = (args.date as string) || new Date().toISOString().split('T')[0];
                    const timeStr = args.time as string;
                    const triggerTime = new Date(`${dateStr}T${timeStr}`);
                    
                    if (triggerTime.getTime() < Date.now()) {
                        triggerTime.setDate(triggerTime.getDate() + 1);
                    }

                    const newEvent: ScheduledEvent = {
                        id: Date.now(),
                        label: (args.label as string) || null,
                        subject: (args.subject as string) || undefined,
                        triggerTime: triggerTime.getTime(),
                        type: name === 'setAlarm' ? 'alarm' : 'reminder',
                    };
                    setEvents(prev => [...prev, newEvent]);
                    const eventType = name === 'setAlarm' ? 'alarm' : 'reminder';
                    confirmationText = `Got it, Sir. I'll set a${name === 'setAlarm' ? 'n' : ''} ${eventType} for ${args.subject || args.label || ''} at ${triggerTime.toLocaleTimeString()}.`;
                } else if (name === 'openApplication' && args.applicationName) {
                    const appName = (args.applicationName as string).toLowerCase();
                    const appUriMap: Record<string, string> = {
                        'calculator': 'calculator:',
                        'spotify': 'spotify:',
                        'slack': 'slack:',
                        'discord': 'discord:',
                        'zoom': 'zoommtg:',
                        'visual studio code': 'vscode:',
                        'vscode': 'vscode:',
                        'word': 'ms-word:',
                        'excel': 'ms-excel:',
                        'powerpoint': 'ms-powerpoint:',
                        'notepad': 'notepad:',
                    };
                    const uri = appUriMap[appName];

                    if (uri) {
                        window.open(uri, '_self');
                        confirmationText = `Certainly, Sir. Opening ${args.applicationName}.`;
                    } else {
                        confirmationText = `My apologies, Sir. I am unable to open ${args.applicationName} at this time.`;
                    }
                } else if (name === 'searchWeb' && args.query) {
                    try {
                        const { summary, sources } = await performSearch(apiKey!, args.query as string);
                        let sourcesText = '';
                        if (sources && sources.length > 0) {
                            const sourceLinks = sources
                                .map((chunk: any) => chunk.web)
                                .filter(Boolean) 
                                .map((web: any) => `* [${web.title}](${web.uri})`)
                                .join('\n');
                            if (sourceLinks) {
                                sourcesText = `\n\n**Sources:**\n${sourceLinks}`;
                            }
                        }
                        confirmationText = `${summary}${sourcesText}`;

                    } catch (searchError) {
                        console.error("Error during web search:", searchError);
                        confirmationText = "My apologies, Sir. I encountered an issue while searching the web.";
                    }
                }
                
                addMessage(confirmationText, 'reggie');
                setStatus('speaking');
                speak(cleanForSpeech(confirmationText), selectedVoiceURI);
            } else if (responseText) {
                addMessage(responseText, 'reggie');
                setStatus('speaking');
                speak(cleanForSpeech(responseText), selectedVoiceURI);
            } else {
                 const fallback = "Sorry, Sir, I couldn't process that.";
                 addMessage(fallback, 'reggie');
                 setStatus('speaking');
                 speak(fallback, selectedVoiceURI);
            }

        } catch (error) {
            console.error("Error processing command:", error);
            const errorMsg = "I seem to be having some trouble, Sir. Please try again later.";
            addMessage(errorMsg, 'reggie');
            setStatus('speaking');
            speak(errorMsg, selectedVoiceURI);
        }
    }, [speak, status, selectedVoiceURI, apiKey]);

    const handleSpeechResult = useCallback((finalTranscript: string, interimTranscript: string) => {
        // If there's a final transcript, append it to the ref to build the full sentence.
        if (finalTranscript) {
            fullTranscriptRef.current = (fullTranscriptRef.current + ' ' + finalTranscript).trim();
        }
        
        // Update the visual live transcript. Show interim if available, otherwise show the accumulating final transcript.
        setLiveTranscript(interimTranscript || fullTranscriptRef.current);

        // Clear any existing timer to reset the "pause" countdown
        if (commandTimerRef.current) {
            clearTimeout(commandTimerRef.current);
        }

        // Set a new timer. If the user keeps talking, this timer will be reset.
        // It only fires when the user pauses for 1.2 seconds.
        commandTimerRef.current = window.setTimeout(() => {
            const transcriptToProcess = fullTranscriptRef.current;
            fullTranscriptRef.current = ''; // Reset for the next complete utterance.
            setLiveTranscript(''); // Clear the display now that we're processing.

            if (!transcriptToProcess) {
                // This block runs if the timer fires after a pause with no new final text.
                // e.g., user was prompted "Yes, sir?" but remained silent.
                if (isAwaitingCommand) {
                    setIsAwaitingCommand(false);
                    setStatus('idle');
                }
                return;
            }

            const lowerTranscript = transcriptToProcess.toLowerCase();
            
            if (isAwaitingCommand) {
                setIsAwaitingCommand(false);
                processCommand(transcriptToProcess);
            } else if (lowerTranscript.includes("hey reggie")) {
                const command = transcriptToProcess.substring(lowerTranscript.lastIndexOf("hey reggie") + "hey reggie".length).trim();
                if (command) {
                    processCommand(command);
                } else {
                    setIsAwaitingCommand(true);
                    setStatus('speaking');
                    speak("Yes, Sir?", selectedVoiceURI);
                }
            }
        }, 1200); // 1.2 second pause before processing.

    }, [isAwaitingCommand, processCommand, speak, selectedVoiceURI]);

    const { error: speechError, startListening } = useSpeechRecognition(handleSpeechResult);

    useEffect(() => {
        if (!apiKey) return; // Don't request mic until API key is set

        const grantMic = async () => {
          try {
            // We just need to request permission. The SpeechRecognition API handles the mic itself.
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the track immediately after getting permission, as we don't need to manually process it.
            stream.getTracks().forEach(track => track.stop());
            startListening();
          } catch (err) {
            console.error("Microphone permission error:", err);
            // The hook will set a more specific error message.
          }
        };
        grantMic();
    }, [apiKey, startListening]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            
            setTimers(prev => {
                const activeTimers = prev.filter(t => t.endTime > now);
                const expiredTimers = prev.filter(t => t.endTime <= now);
                if (expiredTimers.length > 0) {
                    expiredTimers.forEach(t => {
                        const message = `Sir, your ${t.label ? `${t.label} ` : ''}timer is done!`;
                        addMessage(message, 'reggie');
                        speak(message, selectedVoiceURI);
                        alertAudioRef.current?.play();
                    });
                }
                return activeTimers;
            });

            setEvents(prev => {
                const activeEvents = prev.filter(e => e.triggerTime > now);
                const expiredEvents = prev.filter(e => e.triggerTime <= now);
                if (expiredEvents.length > 0) {
                     expiredEvents.forEach(e => {
                        let message = '';
                        if (e.type === 'alarm') {
                            message = `Sir, it's time! ${e.label || 'Your alarm is going off.'}`;
                        } else {
                            message = `A reminder, Sir: ${e.subject || e.label || 'Time for your reminder.'}`;
                        }
                        addMessage(message, 'reggie');
                        speak(message, selectedVoiceURI);
                        alertAudioRef.current?.play();
                    });
                }
                return activeEvents;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [speak, selectedVoiceURI]);
    
    if (!apiKey) {
        return <ApiKeyModal onSave={handleApiKeyUpdate} error={apiKeyError} />;
    }

    return (
        <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-cyan-300 font-mono overflow-hidden">
            <audio ref={alertAudioRef} src={BEEP_SOUND} preload="auto" />
            <div className="absolute top-4 left-4 text-2xl font-bold tracking-[0.2em]">R.E.G.G.I.E.</div>
            <div className="absolute top-4 right-4 z-20">
              <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-cyan-800/50 transition-colors" aria-label="Open settings">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.82l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2.82l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center text-center z-10">
                <StatusIndicator status={status} />
                {speechError && <p className="mt-4 text-red-400 max-w-sm px-4">{speechError}</p>}
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col">
                <div className="flex-grow">
                  <ChatLog messages={messages} />
                </div>
                <LiveTranscript transcript={liveTranscript} />
                <TextInput onSendMessage={processCommand} disabled={status !== 'idle' && status !== 'listening'} />
            </div>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                voices={availableVoices}
                selectedVoiceURI={selectedVoiceURI}
                onVoiceChange={setSelectedVoiceURI}
                apiKey={apiKey}
                onApiKeyChange={handleApiKeyUpdate}
            />
        </div>
    );
};

export default App;