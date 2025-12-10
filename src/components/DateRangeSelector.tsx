'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type DateRangeType = 'day' | 'week';

interface DateRangeSelectorProps {
  selectedDate: Date;
  rangeType: DateRangeType;
  onDateChange: (date: Date) => void;
  onRangeTypeChange: (type: DateRangeType) => void;
}

export function DateRangeSelector({
  selectedDate,
  rangeType,
  onDateChange,
  onRangeTypeChange,
}: DateRangeSelectorProps) {
  const isToday = () => {
    const today = new Date();
    const selected = new Date(selectedDate);
    return (
      today.getFullYear() === selected.getFullYear() &&
      today.getMonth() === selected.getMonth() &&
      today.getDate() === selected.getDate()
    );
  };

  const goToPrevious = () => {
    const newDate = new Date(selectedDate);
    if (rangeType === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    onDateChange(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(selectedDate);
    if (rangeType === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    onDateChange(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatWeekRange = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startStr = startOfWeek.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const endStr = endOfWeek.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return `${startStr} - ${endStr}`;
  };

  const goToToday = () => {
    const today = new Date();
    if (rangeType === 'day') {
      onDateChange(today);
    } else {
      // Week view: go to start of current week
      const startOfWeek = new Date(today);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day;
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      onDateChange(startOfWeek);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={goToPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium truncate">
            {rangeType === 'day'
              ? isToday()
                ? "Today's Activities"
                : 'Activities'
              : 'Week View'}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {rangeType === 'day'
              ? formatDate(selectedDate)
              : formatWeekRange(selectedDate)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={goToNext}
          disabled={rangeType === 'day' && isToday()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 flex-shrink-0"
          onClick={goToToday}
        >
          Today
        </Button>
      </div>
      <div className="flex-shrink-0">
        <Tabs value={rangeType} onValueChange={(value) => onRangeTypeChange(value as DateRangeType)}>
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
