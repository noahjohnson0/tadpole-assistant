'use client';

import { Activity } from '@/types/activity';
import { Day } from '@/types/day';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dateToDateString } from '@/lib/days';

interface WeekViewProps {
  weekDays: Day[];
  loading: boolean;
  newActivityIds?: Set<string>;
}

export function WeekView({ weekDays, loading, newActivityIds = new Set() }: WeekViewProps) {
  const formatDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
    });
  };

  const formatMonthDay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatRepsDuration = (activity: {
    quantity?: string;
    unit?: string;
  }) => {
    if (activity.quantity && activity.unit) {
      return `${activity.quantity} ${activity.unit}`;
    } else if (activity.quantity) {
      return activity.quantity;
    }
    return '—';
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Loading...
      </div>
    );
  }

  const hasAnyActivities = weekDays.some((day) => day.events.length > 0);

  if (!hasAnyActivities) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No activities recorded this week
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map((day, index) => (
        <Card key={day.id} className={`flex flex-col ${index % 2 === 0 ? 'bg-muted/30' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-center">
              <div>{formatDayName(day.date)}</div>
              <div>{formatMonthDay(day.date)}</div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 px-2">
            {day.events.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                No activities
              </div>
            ) : (
              <div className="space-y-2">
                {day.events.map((activity) => {
                  const dateString = dateToDateString(day.date);
                  const activityKey = `${dateString}-${activity.id}`;
                  const isNew = newActivityIds.has(activityKey);
                  
                  return (
                  <div
                    key={activity.id}
                    className={`px-2 py-2.5 border rounded-md ${isNew ? 'activity-pop' : ''}`}
                  >
                    <div className="font-medium text-sm">{activity.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatRepsDuration(activity)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(activity.timestamp)}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
