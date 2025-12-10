'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getUserById } from '@/lib/users';
import { TrackedActivity } from '@/types/tracked-activity';

export function useTrackedActivities() {
  const { user, isAuthenticated } = useAuth();
  const [trackedActivities, setTrackedActivities] = useState<TrackedActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setTrackedActivities([]);
      setLoading(false);
      return;
    }

    const loadTrackedActivities = async () => {
      try {
        setLoading(true);
        const userDoc = await getUserById(user.uid);
        setTrackedActivities(userDoc?.trackedActivities || []);
      } catch (error) {
        console.error('Error loading tracked activities:', error);
        setTrackedActivities([]);
      } finally {
        setLoading(false);
      }
    };

    loadTrackedActivities();
  }, [isAuthenticated, user]);

  // Get only active tracked activities
  const activeActivities = trackedActivities.filter((activity) => activity.active);

  // Check if an activity name matches any active tracked activity
  const isActivityActive = (activityName: string): boolean => {
    if (activeActivities.length === 0) {
      // If no tracked activities configured, allow all (backward compatibility)
      return true;
    }

    const lowerActivityName = activityName.toLowerCase();

    return activeActivities.some((trackedActivity) => {
      // Check if activity name matches
      if (trackedActivity.name.toLowerCase() === lowerActivityName) {
        return true;
      }

      // Check if any keywords match
      if (trackedActivity.keywords) {
        return trackedActivity.keywords.some((keyword) =>
          lowerActivityName.includes(keyword.toLowerCase())
        );
      }

      return false;
    });
  };

  return {
    trackedActivities,
    activeActivities,
    isActivityActive,
    loading,
  };
}
