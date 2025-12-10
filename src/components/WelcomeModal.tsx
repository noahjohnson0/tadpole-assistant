'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, Activity, Calendar } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Tadpole! 🐸</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Your voice-activated activity tracking assistant
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">How it works:</h3>

            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <Mic className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Voice-Activated Tracking</p>
                  <p className="text-sm text-muted-foreground">
                    Simply speak your activities out loud. For example: &quot;I did 50 pushups&quot; or &quot;I ran 3 miles&quot;
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Automatic Activity Recognition</p>
                  <p className="text-sm text-muted-foreground">
                    Tadpole automatically recognizes activities, quantities, and units from your voice commands
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Daily Activity Log</p>
                  <p className="text-sm text-muted-foreground">
                    All your activities are organized by day. View your progress and track your habits over time
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Tip:</strong> The app is always listening. Just speak naturally and your activities will be tracked automatically!
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} className="w-full sm:w-auto">
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
