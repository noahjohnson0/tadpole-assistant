'use client';

import React, { createContext, useContext, useState } from 'react';

interface VoiceContextType {
  transcript: string;
  setTranscript: (transcript: string) => void;
  isSpeaking: boolean;
  setIsSpeaking: (isSpeaking: boolean) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [transcript, setTranscript] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  return (
    <VoiceContext.Provider
      value={{
        transcript,
        setTranscript,
        isSpeaking,
        setIsSpeaking,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
