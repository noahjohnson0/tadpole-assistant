import { useState, useRef } from 'react';
import { Activity } from '@/types/activity';
import { useActivities } from '@/context/ActivityContext';
import { useAuth } from '@/hooks/useAuth';
import { useTrackedActivities } from '@/hooks/useTrackedActivities';
import { normalizeActivityName, isValidTrackedActivity } from '@/lib/activities';
import { dateToDateString, updateEventInDay, removeEventFromDay, getDayByDate } from '@/lib/days';
import { toast } from 'sonner';

interface EditValues {
  name: string;
  quantity: string;
  unit: string;
}

export function useActivityEdit(
  selectedDate: Date,
  isToday: () => boolean,
  reloadActivities: () => Promise<void> | void
) {
  const { removeActivity, updateActivity } = useActivities();
  const { user } = useAuth();
  const { trackedActivities } = useTrackedActivities();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditValues | null>(null);
  const editContainerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDeleteClick = async (activity: Activity, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pendingDeleteId === activity.id) {
      // Already in delete mode, confirm deletion
      if (!user) return;

      const dateString = dateToDateString(selectedDate);

      try {
        // Use context function for today, direct function for other dates
        if (isToday()) {
          await removeActivity(activity);
        } else {
          await removeEventFromDay(user.uid, dateString, activity);
          toast.success('Activity deleted successfully');
        }
      } catch (error) {
        toast.error('Failed to delete activity');
        throw error;
      }

      setPendingDeleteId(null);
      await reloadActivities();
    } else {
      // Switch to delete mode (show trashcan)
      setPendingDeleteId(activity.id);
      // Exit edit mode if in delete mode
      if (editingId === activity.id) {
        setEditingId(null);
        setEditValues(null);
      }
    }
  };

  const handleEditClick = (activity: Activity, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId === activity.id) {
      // Already editing, exit edit mode
      setEditingId(null);
      setEditValues(null);
    } else {
      // Enter edit mode
      setEditingId(activity.id);
      setEditValues({
        name: activity.name,
        quantity: activity.quantity || '',
        unit: activity.unit || '',
      });
      // Exit delete mode if in delete mode
      if (pendingDeleteId === activity.id) {
        setPendingDeleteId(null);
      }
    }
  };

  const handleFieldChange = (field: 'name' | 'quantity' | 'unit', value: string) => {
    if (!editValues) return;
    setEditValues({ ...editValues, [field]: value });
  };

  const handleSave = async (oldActivity: Activity) => {
    if (!editValues || !editingId || !user) return;

    // Normalize activity name to match canonical name from tracked activities
    const normalizedName = normalizeActivityName(editValues.name.trim(), trackedActivities);

    // Validate that the normalized name exists in tracked activities
    if (trackedActivities.length > 0) {
      if (!isValidTrackedActivity(normalizedName, trackedActivities)) {
        // Activity name doesn't match any tracked activity, reject it
        console.warn(`Activity "${editValues.name}" (normalized to "${normalizedName}") does not match any tracked activity. Rejecting update.`);
        setEditingId(null);
        setEditValues(null);
        return;
      }
    }

    const updatedActivity: Activity = {
      ...oldActivity,
      name: normalizedName,
      quantity: editValues.quantity.trim() || undefined,
      unit: editValues.unit.trim() || undefined,
    };

    // Only update if something changed
    if (
      updatedActivity.name !== oldActivity.name ||
      updatedActivity.quantity !== oldActivity.quantity ||
      updatedActivity.unit !== oldActivity.unit
    ) {
      const dateString = dateToDateString(selectedDate);

      // Use context function for today, direct function for other dates
      if (isToday()) {
        await updateActivity(oldActivity, updatedActivity);
      } else {
        await updateEventInDay(user.uid, dateString, oldActivity, updatedActivity);
      }

      await reloadActivities();
    }

    setEditingId(null);
    setEditValues(null);
  };

  const handleFieldBlur = (activity: Activity, e: React.FocusEvent) => {
    // Clear any existing timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    // Use a small timeout to allow clicks within the edit area to refocus
    blurTimeoutRef.current = setTimeout(() => {
      // Check if we're still editing this activity
      if (editingId !== activity.id) {
        return;
      }

      // Check if the new focus target is still within any edit container for this activity
      const editContainer = editContainerRefs.current[activity.id];
      const activeElement = document.activeElement as HTMLElement | null;
      const relatedTarget = e.relatedTarget as HTMLElement | null;

      // Check if focus moved to another input in the same row (name, quantity, or unit)
      const isFocusInEditArea =
        (editContainer && activeElement && editContainer.contains(activeElement)) ||
        (editContainer && relatedTarget && editContainer.contains(relatedTarget)) ||
        (activeElement?.tagName === 'INPUT' && activeElement.closest('tr')?.getAttribute('data-activity-id') === activity.id) ||
        (relatedTarget?.tagName === 'INPUT' && relatedTarget.closest('tr')?.getAttribute('data-activity-id') === activity.id);

      if (isFocusInEditArea) {
        // Focus moved to another element within the edit area, don't save
        return;
      }

      // Focus moved outside the edit area, save and exit edit mode
      handleSave(activity);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent, activity: Activity) => {
    if (e.key === 'Enter') {
      handleSave(activity);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditValues(null);
    }
  };

  return {
    pendingDeleteId,
    editingId,
    editValues,
    editContainerRefs,
    handleDeleteClick,
    handleEditClick,
    handleFieldChange,
    handleFieldBlur,
    handleKeyDown,
  };
}
