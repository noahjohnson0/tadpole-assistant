'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Activity } from '@/types/activity';
import { useAuth } from '@/hooks/useAuth';
import { addEventToDay, removeEventFromDay, updateEventInDay, getTodayDateString, getDayByDate } from '@/lib/days';
import { getUserById, createUser } from '@/lib/users';
import { normalizeActivityName, isValidTrackedActivity } from '@/lib/activities';
import { TrackedActivity } from '@/types/tracked-activity';
import { toast } from 'sonner';

interface ActivityContextType {
  activities: Activity[];
  addActivity: (name: string, quantity?: string, unit?: string, transcribedPhrase?: string) => Promise<void>;
  updateActivity: (oldActivity: Activity, updatedActivity: Activity) => Promise<void>;
  removeActivity: (activity: Activity) => Promise<void>;
  getTodayActivities: () => Activity[];
  clearActivities: () => void;
  loading: boolean;
  lastAddedActivity: Activity | null;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastAddedActivity, setLastAddedActivity] = useState<Activity | null>(null);
  const [trackedActivities, setTrackedActivities] = useState<TrackedActivity[]>([]);
  const { user, isAuthenticated } = useAuth();

  // Load tracked activities when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setTrackedActivities([]);
      return;
    }

    const loadTrackedActivities = async () => {
      try {
        const userDoc = await getUserById(user.uid);
        if (userDoc?.trackedActivities) {
          setTrackedActivities(userDoc.trackedActivities);
        } else {
          setTrackedActivities([]);
        }
      } catch (error) {
        console.error('Error loading tracked activities:', error);
        setTrackedActivities([]);
      }
    };

    loadTrackedActivities();
  }, [isAuthenticated, user]);

  // Load today's activities from Firestore when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setActivities([]);
      return;
    }

    const loadTodayActivities = async () => {
      try {
        setLoading(true);
        // Ensure user document exists
        const userDoc = await getUserById(user.uid);
        if (!userDoc) {
          // Create user document if it doesn't exist
          await createUser(
            { email: user.email || '' },
            user.uid
          );
        }

        // Load today's day document
        const todayDateString = getTodayDateString();
        const todayDay = await getDayByDate(user.uid, todayDateString);

        if (todayDay) {
          setActivities(todayDay.events);
        } else {
          setActivities([]);
        }
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTodayActivities();
  }, [isAuthenticated, user]);

  // Helper function to determine if an activity should use "reps" as the unit
  const shouldUseReps = useCallback((activityName: string): boolean => {
    const lowerName = activityName.toLowerCase();
    const repActivities = [
      'situp', 'sit-up', 'sit ups', 'situps',
      'pushup', 'push-up', 'push ups', 'pushups',
      'squat', 'squats',
      'pullup', 'pull-up', 'pull ups', 'pullups',
      'crunch', 'crunches',
      'burpee', 'burpees',
      'jumping jack', 'jumping jacks',
      'lunge', 'lunges',
      'dip', 'dips',
      'plank', 'planks',
    ];
    return repActivities.some(activity => lowerName.includes(activity));
  }, []);

  const addActivity = useCallback(
    async (name: string, quantity?: string, unit?: string, transcribedPhrase?: string) => {
      if (!isAuthenticated || !user) {
        console.error('Cannot add activity: user not authenticated');
        return;
      }

      // Normalize activity name to match canonical name from tracked activities
      const normalizedName = normalizeActivityName(name, trackedActivities);

      // Validate that the normalized name exists in tracked activities
      if (trackedActivities.length > 0) {
        if (!isValidTrackedActivity(normalizedName, trackedActivities)) {
          // Activity name doesn't match any tracked activity, reject it
          console.warn(`Activity "${name}" (normalized to "${normalizedName}") does not match any tracked activity. Rejecting.`);
          return;
        }
      }

      // Automatically set unit to "reps" for rep-based exercises if no unit is provided
      let finalUnit = unit;
      if (!finalUnit && quantity && shouldUseReps(normalizedName)) {
        finalUnit = 'reps';
      }

      const newActivity: Activity = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: normalizedName,
        quantity,
        unit: finalUnit,
        timestamp: new Date(),
        transcribedPhrase,
      };

      // Update local state immediately
      setActivities((prev) => [newActivity, ...prev]);
      // Set last added activity for navbar flash animation
      setLastAddedActivity(newActivity);

      try {
        // Ensure user document exists
        const userDoc = await getUserById(user.uid);
        if (!userDoc) {
          await createUser(
            { email: user.email || '' },
            user.uid
          );
        }

        // Save to Firestore
        const todayDateString = getTodayDateString();
        await addEventToDay(user.uid, todayDateString, newActivity);
      } catch (error) {
        console.error('Error saving activity to Firestore:', error);
        // Remove from local state if save failed
        setActivities((prev) => prev.filter((a) => a.id !== newActivity.id));
        throw error;
      }
    },
    [isAuthenticated, user, shouldUseReps, trackedActivities]
  );

  const getTodayActivities = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return activities.filter((activity) => {
      const activityDate = new Date(activity.timestamp);
      activityDate.setHours(0, 0, 0, 0);
      return activityDate.getTime() === today.getTime();
    });
  }, [activities]);

  const updateActivity = useCallback(
    async (oldActivity: Activity, updatedActivity: Activity) => {
      if (!isAuthenticated || !user) {
        console.error('Cannot update activity: user not authenticated');
        return;
      }

      // Normalize activity name to match canonical name from tracked activities
      const normalizedName = normalizeActivityName(updatedActivity.name, trackedActivities);

      // Validate that the normalized name exists in tracked activities
      if (trackedActivities.length > 0) {
        if (!isValidTrackedActivity(normalizedName, trackedActivities)) {
          // Activity name doesn't match any tracked activity, reject it
          console.warn(`Activity "${updatedActivity.name}" (normalized to "${normalizedName}") does not match any tracked activity. Rejecting update.`);
          return;
        }
      }

      // Automatically set unit to "reps" for rep-based exercises if no unit is provided
      let finalUnit = updatedActivity.unit;
      if (!finalUnit && updatedActivity.quantity && shouldUseReps(normalizedName)) {
        finalUnit = 'reps';
      }

      const finalUpdatedActivity: Activity = {
        ...updatedActivity,
        name: normalizedName,
        unit: finalUnit,
      };

      // Update local state immediately
      setActivities((prev) =>
        prev.map((a) => (a.id === oldActivity.id ? finalUpdatedActivity : a))
      );

      try {
        // Update in Firestore
        const todayDateString = getTodayDateString();
        await updateEventInDay(user.uid, todayDateString, oldActivity, finalUpdatedActivity);
      } catch (error) {
        console.error('Error updating activity in Firestore:', error);
        // Revert local state if update failed
        setActivities((prev) =>
          prev.map((a) => (a.id === oldActivity.id ? oldActivity : a))
        );
        throw error;
      }
    },
    [isAuthenticated, user, shouldUseReps, trackedActivities]
  );

  const removeActivity = useCallback(
    async (activity: Activity) => {
      if (!isAuthenticated || !user) {
        console.error('Cannot remove activity: user not authenticated');
        return;
      }

      // Update local state immediately
      setActivities((prev) => prev.filter((a) => a.id !== activity.id));

      try {
        // Remove from Firestore
        const todayDateString = getTodayDateString();
        await removeEventFromDay(user.uid, todayDateString, activity);
        toast.success('Activity deleted successfully');
      } catch (error) {
        console.error('Error removing activity from Firestore:', error);
        // Re-add to local state if removal failed
        setActivities((prev) => [activity, ...prev].sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
        toast.error('Failed to delete activity');
        throw error;
      }
    },
    [isAuthenticated, user]
  );

  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  return (
    <ActivityContext.Provider
      value={{
        activities,
        addActivity,
        updateActivity,
        removeActivity,
        getTodayActivities,
        clearActivities,
        loading,
        lastAddedActivity,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivities() {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivities must be used within an ActivityProvider');
  }
  return context;
}

