'use client';

import { useEffect, useState, useMemo } from 'react';
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { ActivityTable } from "@/components/ActivityTable";
import { Login } from "@/components/Login";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/hooks/useAuth";
import { useActivities } from "@/context/ActivityContext";
import { useVoice } from "@/context/VoiceContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TadpoleIcon } from "@/components/TadpoleIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Mic, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { lastAddedActivity } = useActivities();
  const { transcript, isSpeaking } = useVoice();
  const { setTheme, theme } = useTheme();
  const [displayActivity, setDisplayActivity] = useState<typeof lastAddedActivity>(null);
  const [isFading, setIsFading] = useState(false);
  const [shownActivityIds, setShownActivityIds] = useState<Set<string>>(new Set());
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptAtSessionStart, setTranscriptAtSessionStart] = useState<string>('');
  const [previousIsSpeaking, setPreviousIsSpeaking] = useState(false);

  // Get last few words from transcript (last 10 words)
  const getLastFewWords = (text: string, wordCount: number = 10): string => {
    const words = text.trim().split(/\s+/);
    if (words.length <= wordCount) return text;
    return words.slice(-wordCount).join(' ');
  };

  // Get only the transcript from the current speaking session
  const currentSessionTranscript = useMemo((): string => {
    if (!transcript) return '';
    if (!transcriptAtSessionStart) return transcript;

    // If current transcript doesn't start with the session start transcript,
    // it means we've moved to a new session, so return the full current transcript
    if (!transcript.startsWith(transcriptAtSessionStart)) {
      return transcript;
    }

    // Otherwise, return only the portion added since session start
    return transcript.slice(transcriptAtSessionStart.length).trim();
  }, [transcript, transcriptAtSessionStart]);

  // Track when a new speaking session starts
  useEffect(() => {
    // Detect transition from not speaking to speaking (new session)
    if (isSpeaking && !previousIsSpeaking) {
      // New speaking session started - store current transcript as baseline
      setTranscriptAtSessionStart(transcript || '');
    }

    // Detect transition from speaking to not speaking
    if (!isSpeaking && previousIsSpeaking) {
      // Speaking session ended - reset baseline for next session
      setTranscriptAtSessionStart('');
    }

    setPreviousIsSpeaking(isSpeaking);
  }, [isSpeaking, previousIsSpeaking, transcript]);

  // Show transcript when user is speaking
  useEffect(() => {
    if (isSpeaking && currentSessionTranscript) {
      setShowTranscript(true);
      setDisplayActivity(null); // Clear activity display when showing transcript
    } else if (!isSpeaking && showTranscript) {
      // Keep transcript visible briefly after speaking stops
      const timer = setTimeout(() => {
        setShowTranscript(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSpeaking, currentSessionTranscript, showTranscript]);

  // Handle activity flash and fade animation
  useEffect(() => {
    if (lastAddedActivity && !shownActivityIds.has(lastAddedActivity.id)) {
      // Mark this activity as shown
      setShownActivityIds(prev => new Set(prev).add(lastAddedActivity.id));

      // Immediately hide transcript and show activity
      setShowTranscript(false);
      setDisplayActivity(lastAddedActivity);
      setIsFading(false);

      // Start fade after flash completes (300ms)
      const fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, 300);

      // Clear activity after fade completes (300ms flash + 2000ms fade)
      const clearTimer = setTimeout(() => {
        setDisplayActivity(null);
        setIsFading(false);
      }, 2300);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(clearTimer);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAddedActivity]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Login />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <main className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TadpoleIcon size={48} className="text-primary" />
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Tadpole
                </span>
              </h1>
              <span className="text-muted-foreground">•</span>
              <div className="relative min-w-[200px]">
                {showTranscript && currentSessionTranscript ? (
                  <p className="text-lg text-muted-foreground italic">
                    "{getLastFewWords(currentSessionTranscript)}"
                  </p>
                ) : displayActivity ? (
                  <p className={`text-lg font-semibold text-primary transition-all duration-300 ${isFading ? 'activity-fade' : 'activity-flash'
                    }`}>
                    ✓ {displayActivity.name}
                    {displayActivity.quantity && (
                      <span className="text-muted-foreground ml-2">
                        {displayActivity.quantity} {displayActivity.unit || ''}
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-muted-foreground always-listening-pulse flex items-center gap-2">
                    <span className="relative">
                      <Mic className="h-4 w-4" />
                      <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full border border-background"></span>
                    </span>
                    Listening
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                  <Avatar>
                    <AvatarFallback>
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="light">
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">
                    <Monitor className="mr-2 h-4 w-4" />
                    System
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/tracked-activities">Tracked Activities</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={async () => {
                    await signOut();
                  }}
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* VoiceAssistant mounted to stay active - always listening */}
        <div className="hidden">
          <VoiceAssistant />
        </div>

        <ActivityTable />
      </main>
    </div>
  );
}
