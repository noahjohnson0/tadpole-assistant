import { useEffect } from 'react';
import { DateRangeType } from '@/components/DateRangeSelector';

export function useKeyboardNavigation(
  selectedDate: Date,
  rangeType: DateRangeType,
  onDateChange: (date: Date) => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle arrow keys if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const today = new Date();
      const selected = new Date(selectedDate);
      const isSelectedToday =
        today.getFullYear() === selected.getFullYear() &&
        today.getMonth() === selected.getMonth() &&
        today.getDate() === selected.getDate();

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const newDate = new Date(selectedDate);
        if (rangeType === 'day') {
          newDate.setDate(newDate.getDate() - 1);
        } else {
          newDate.setDate(newDate.getDate() - 7);
        }
        onDateChange(newDate);
      } else if (e.key === 'ArrowRight') {
        if (rangeType === 'day' && isSelectedToday) {
          return; // Can't go forward from today
        }
        e.preventDefault();
        const newDate = new Date(selectedDate);
        if (rangeType === 'day') {
          newDate.setDate(newDate.getDate() + 1);
        } else {
          newDate.setDate(newDate.getDate() + 7);
        }
        onDateChange(newDate);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedDate, rangeType, onDateChange]);
}
