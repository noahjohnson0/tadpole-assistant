'use client';

import { useState } from 'react';
import { useActivityData } from '@/hooks/useActivityData';
import { useActivityEdit } from '@/hooks/useActivityEdit';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DateRangeSelector, DateRangeType } from '@/components/DateRangeSelector';
import { WeekView } from '@/components/WeekView';
import { ActivityTableRow } from '@/components/ActivityTableRow';

export function ActivityTable() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [rangeType, setRangeType] = useState<DateRangeType>('day');

  const { displayedActivities, weekDays, loading, reloadActivities, newActivityIds } = useActivityData(
    selectedDate,
    rangeType
  );

  // Check if selected date is today
  const isToday = () => {
    const today = new Date();
    const selected = new Date(selectedDate);
    return (
      today.getFullYear() === selected.getFullYear() &&
      today.getMonth() === selected.getMonth() &&
      today.getDate() === selected.getDate()
    );
  };

  const {
    pendingDeleteId,
    editingId,
    editValues,
    editContainerRefs,
    handleDeleteClick,
    handleEditClick,
    handleFieldChange,
    handleFieldBlur,
    handleKeyDown,
  } = useActivityEdit(selectedDate, isToday, reloadActivities);

  useKeyboardNavigation(selectedDate, rangeType, setSelectedDate);

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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <DateRangeSelector
          selectedDate={selectedDate}
          rangeType={rangeType}
          onDateChange={setSelectedDate}
          onRangeTypeChange={setRangeType}
        />
      </CardHeader>
      <CardContent>
        {rangeType === 'week' ? (
          <WeekView weekDays={weekDays} loading={loading} newActivityIds={newActivityIds} />
        ) : loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Loading...
          </p>
        ) : displayedActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {isToday()
              ? "No activities recorded today"
              : `No activities recorded on ${formatDate(selectedDate)}`
            }
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Reps/Duration</TableHead>
                <TableHead className="text-right">Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedActivities.map((activity) => {
                const isPendingDelete = pendingDeleteId === activity.id;
                const isEditing = editingId === activity.id;
                const currentEditValues = isEditing && editValues ? editValues : null;

                return (
                  <ActivityTableRow
                    key={activity.id}
                    activity={activity}
                    isPendingDelete={isPendingDelete}
                    isEditing={isEditing}
                    editValues={currentEditValues}
                    editContainerRef={(el) => {
                      editContainerRefs.current[activity.id] = el;
                    }}
                    onEditClick={handleEditClick}
                    onDeleteClick={handleDeleteClick}
                    onFieldChange={handleFieldChange}
                    onFieldBlur={handleFieldBlur}
                    onKeyDown={handleKeyDown}
                    formatTime={formatTime}
                    formatRepsDuration={formatRepsDuration}
                    isNew={newActivityIds.has(activity.id)}
                  />
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
