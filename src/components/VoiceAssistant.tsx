'use client';

import { useEffect } from 'react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useActivities } from '@/context/ActivityContext';
import { useTrackedActivities } from '@/hooks/useTrackedActivities';
import { useVoice } from '@/context/VoiceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TadpoleIcon } from '@/components/TadpoleIcon';

export function VoiceAssistant() {
    const { addActivity } = useActivities();
    const { isActivityActive } = useTrackedActivities();
    const { setTranscript, setIsSpeaking } = useVoice();
    const { isListening, transcript, isSpeaking, isStarted, error, startRecognition } =
        useVoiceRecognition({
            onActivityDetected: (name, quantity, unit, transcribedPhrase) => {
                // Only add activity if it's active in tracked activities
                if (isActivityActive(name)) {
                    addActivity(name, quantity, unit, transcribedPhrase);
                }
            },
        });

    // Update VoiceContext with transcript and speaking state
    useEffect(() => {
        setTranscript(transcript);
    }, [transcript, setTranscript]);

    useEffect(() => {
        setIsSpeaking(isSpeaking);
    }, [isSpeaking, setIsSpeaking]);

    // Auto-start recognition when component mounts
    useEffect(() => {
        if (!isStarted) {
            startRecognition();
        }
    }, [isStarted, startRecognition]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TadpoleIcon size={28} className="text-primary" />
                    <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Tadpole
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div
                            className={`h-4 w-4 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                                }`}
                        />
                        <span className="text-sm">
                            {isListening ? 'Listening...' : isStarted ? 'Starting...' : 'Initializing...'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div
                            className={`h-3 w-3 rounded-full ${isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                                }`}
                        />
                        <span className="text-sm text-muted-foreground">
                            {isSpeaking ? 'Speech detected' : 'Waiting for speech...'}
                        </span>
                    </div>

                    {transcript && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-2">Transcript:</p>
                            <p className="text-sm">{transcript}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
