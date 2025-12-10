'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserById, updateTrackedActivities, createUser } from '@/lib/users';
import { TrackedActivity } from '@/types/tracked-activity';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DEFAULT_ACTIVITIES } from '@/lib/activities';

export function TrackedActivities() {
  const { user, isAuthenticated } = useAuth();
  const [trackedActivities, setTrackedActivities] = useState<TrackedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load tracked activities from Firestore
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setTrackedActivities([]);
      setLoading(false);
      return;
    }

    const loadTrackedActivities = async () => {
      try {
        setLoading(true);
        let userDoc = await getUserById(user.uid);

        // Ensure user document exists
        if (!userDoc) {
          await createUser(
            { email: user.email || '' },
            user.uid
          );
          userDoc = await getUserById(user.uid);
        }

        if (userDoc?.trackedActivities && userDoc.trackedActivities.length > 0) {
          setTrackedActivities(userDoc.trackedActivities);
        } else {
          // Initialize with default activities if none exist
          const defaultActivities: TrackedActivity[] = DEFAULT_ACTIVITIES.map((activity, index) => ({
            id: `default-${index}`,
            ...activity,
          }));
          setTrackedActivities(defaultActivities);
          // Save defaults to Firestore
          await updateTrackedActivities(user.uid, defaultActivities);
        }
      } catch (error) {
        console.error('Error loading tracked activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrackedActivities();
  }, [isAuthenticated, user]);

  const handleToggle = async (activityId: string) => {
    if (!user || saving) return;

    const updatedActivities = trackedActivities.map((activity) =>
      activity.id === activityId
        ? { ...activity, active: !activity.active }
        : activity
    );

    setTrackedActivities(updatedActivities);

    try {
      setSaving(true);
      await updateTrackedActivities(user.uid, updatedActivities);
    } catch (error) {
      console.error('Error updating tracked activity:', error);
      // Revert on error
      setTrackedActivities(trackedActivities);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tracked Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracked Activities</CardTitle>
        <CardDescription>
          Configure which activities you want Tadpole to listen for
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {trackedActivities.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No activities configured
          </div>
        ) : (
          <div className="space-y-3">
            {trackedActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex flex-col space-y-1">
                  <Label htmlFor={`activity-${activity.id}`} className="text-sm font-medium">
                    {activity.name}
                  </Label>
                  {activity.keywords && activity.keywords.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Keywords: {activity.keywords.join(', ')}
                    </span>
                  )}
                </div>
                <Switch
                  id={`activity-${activity.id}`}
                  checked={activity.active}
                  onCheckedChange={() => handleToggle(activity.id)}
                  disabled={saving}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
