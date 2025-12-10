'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { parseActivity } from '@/lib/activity-parser';
import { getSpeechRecognition, createSpeechRecognition } from '@/lib/speech-recognition';

interface UseVoiceRecognitionOptions {
    onActivityDetected: (activity: string, quantity?: string, unit?: string, transcribedPhrase?: string) => void;
    isActivityActive?: (activityName: string) => boolean;
}

interface VoiceState {
    isListening: boolean;
    transcript: string;
    isSpeaking: boolean;
    isStarted: boolean;
    error: string | null;
}

export function useVoiceRecognition({
    onActivityDetected,
    isActivityActive,
}: UseVoiceRecognitionOptions) {
    const [state, setState] = useState<VoiceState>({
        isListening: false,
        transcript: '',
        isSpeaking: false,
        isStarted: false,
        error: null,
    });

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const transcriptBufferRef = useRef<string>('');
    const isStartedRef = useRef(false);

    const handleActivityParsing = useCallback(
        (text: string) => {
            parseActivity(text, onActivityDetected, isActivityActive);
        },
        [onActivityDetected, isActivityActive]
    );

    const startRecognition = useCallback(() => {
        if (isStartedRef.current) {
            return;
        }

        if (!getSpeechRecognition()) {
            setState((prev) => ({
                ...prev,
                error: 'Speech recognition not supported in this browser',
            }));
            return;
        }

        const recognition = createSpeechRecognition({
            onStart: () => {
                isStartedRef.current = true;
                setState((prev) => ({
                    ...prev,
                    isListening: true,
                    isStarted: true,
                    isSpeaking: true,
                    error: null,
                }));
            },
            onResult: (event: SpeechRecognitionEvent) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                const fullTranscript = transcriptBufferRef.current + finalTranscript;
                transcriptBufferRef.current = fullTranscript;

                setState((prev) => ({
                    ...prev,
                    transcript: fullTranscript + interimTranscript,
                    isSpeaking: interimTranscript.length > 0,
                }));

                if (finalTranscript) {
                    handleActivityParsing(finalTranscript.trim());
                }
            },
            onError: (event: SpeechRecognitionErrorEvent) => {
                console.error('Recognition error:', event.error);

                if (event.error === 'not-allowed') {
                    isStartedRef.current = false;
                    setState((prev) => ({
                        ...prev,
                        error: 'Microphone permission denied. Please allow microphone access and refresh the page.',
                        isStarted: false,
                        isListening: false,
                    }));
                    return;
                }

                if (event.error !== 'no-speech') {
                    setState((prev) => ({
                        ...prev,
                        error: `Recognition error: ${event.error}`,
                    }));
                }
            },
            onEnd: () => {
                if (isStartedRef.current) {
                    setTimeout(() => {
                        try {
                            if (recognitionRef.current && isStartedRef.current) {
                                recognitionRef.current.start();
                            }
                        } catch (e) {
                            isStartedRef.current = false;
                            setState((prev) => ({
                                ...prev,
                                isListening: false,
                                isStarted: false,
                            }));
                        }
                    }, 100);
                }
            },
        });

        if (!recognition) {
            setState((prev) => ({
                ...prev,
                error: 'Speech recognition not supported in this browser',
            }));
            return;
        }

        recognitionRef.current = recognition;
        isStartedRef.current = true;

        try {
            recognition.start();
        } catch (e) {
            console.error('Error starting recognition:', e);
            isStartedRef.current = false;
            setState((prev) => ({
                ...prev,
                error: `Failed to start recognition: ${e instanceof Error ? e.message : 'Unknown error'}`,
                isStarted: false,
            }));
        }
    }, [handleActivityParsing]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && !isStartedRef.current) {
                startRecognition();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [startRecognition]);

    return {
        ...state,
        startRecognition,
    };
}
