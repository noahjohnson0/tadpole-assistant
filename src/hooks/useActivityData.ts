import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { dateToDateString } from '@/lib/days';
import { Activity } from '@/types/activity';
import { Day } from '@/types/day';
import { DateRangeType } from '@/components/DateRangeSelector';
import { useDocument } from 'react-firebase-hooks/firestore';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Get start of week for a given date
function getStartOfWeek(date: Date): Date {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day;
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

// Get all days in a week
function getWeekDays(startDate: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    days.push(day);
  }
  return days;
}

/**
 * Convert Firestore Timestamp to Date
 */
function timestampToDate(timestamp: any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date();
}

/**
 * Convert Firestore document to Day
 */
function docToDay(docId: string, data: any): Day {
  return {
    id: docId,
    date: timestampToDate(data?.date),
    events: (data?.events || []).map((event: any) => ({
      id: event.id,
      name: event.name,
      quantity: event.quantity,
      unit: event.unit,
      timestamp: timestampToDate(event.timestamp),
      transcribedPhrase: event.transcribedPhrase,
    })),
    createdAt: data?.createdAt ? timestampToDate(data.createdAt) : undefined,
    updatedAt: data?.updatedAt ? timestampToDate(data.updatedAt) : undefined,
  };
}

export function useActivityData(selectedDate: Date, rangeType: DateRangeType) {
  const { user } = useAuth();
  const [displayedActivities, setDisplayedActivities] = useState<Activity[]>([]);
  const [weekDays, setWeekDays] = useState<Day[]>([]);
  const [newActivityIds, setNewActivityIds] = useState<Set<string>>(new Set());
  const previousActivityIdsRef = useRef<Set<string>>(new Set());
  const previousWeekActivityIdsRef = useRef<Map<string, Set<string>>>(new Map());
  const weekUnsubscribesRef = useRef<Unsubscribe[]>([]);

  // Real-time listener for day view
  const dateString = dateToDateString(selectedDate);
  const dayDocRef = user ? doc(db, 'users', user.uid, 'days', dateString) : null;
  const [daySnapshot, dayLoading, dayError] = useDocument(dayDocRef);

  // Process day view data
  useEffect(() => {
    if (rangeType !== 'day' || !user) {
      setDisplayedActivities([]);
      previousActivityIdsRef.current = new Set();
      return;
    }

    if (dayLoading) {
      return;
    }

    if (dayError) {
      console.error('Error loading day:', dayError);
      setDisplayedActivities([]);
      return;
    }

    if (daySnapshot?.exists()) {
      const day = docToDay(daySnapshot.id, daySnapshot.data());
      const currentActivityIds = new Set(day.events.map((e) => e.id));
      
      // Find newly added activities
      const newIds = new Set<string>();
      currentActivityIds.forEach((id) => {
        if (!previousActivityIdsRef.current.has(id)) {
          newIds.add(id);
        }
      });

      setDisplayedActivities(day.events);
      setNewActivityIds(newIds);
      previousActivityIdsRef.current = currentActivityIds;

      // Clear animation class after animation completes
      if (newIds.size > 0) {
        setTimeout(() => {
          setNewActivityIds((prev) => {
            const updated = new Set(prev);
            newIds.forEach((id) => updated.delete(id));
            return updated;
          });
        }, 600); // Match animation duration
      }
    } else {
      setDisplayedActivities([]);
      previousActivityIdsRef.current = new Set();
    }
  }, [daySnapshot, dayLoading, dayError, rangeType, user]);

  // Real-time listeners for week view
  useEffect(() => {
    if (rangeType !== 'week' || !user) {
      // Clean up existing listeners
      weekUnsubscribesRef.current.forEach((unsubscribe) => unsubscribe());
      weekUnsubscribesRef.current = [];
      setWeekDays([]);
      previousWeekActivityIdsRef.current = new Map();
      return;
    }

    // Clean up existing listeners
    weekUnsubscribesRef.current.forEach((unsubscribe) => unsubscribe());
    weekUnsubscribesRef.current = [];

    const startOfWeek = getStartOfWeek(selectedDate);
    const weekDates = getWeekDays(startOfWeek);
    const daysData: (Day | null)[] = new Array(7).fill(null);
    const loadedRef = { count: 0 };
    let isInitialLoad = true;

    const updateWeekDays = () => {
      const days: Day[] = [];
      const allNewActivityIds = new Map<string, Set<string>>();

      weekDates.forEach((date, index) => {
        const dateString = dateToDateString(date);
        const dayData = daysData[index];

        if (dayData) {
          const currentActivityIds = new Set(dayData.events.map((e) => e.id));
          
          // Find newly added activities for this day (only after initial load)
          if (!isInitialLoad) {
            const previousIds = previousWeekActivityIdsRef.current.get(dateString) || new Set();
            const newIds = new Set<string>();
            currentActivityIds.forEach((id) => {
              if (!previousIds.has(id)) {
                newIds.add(id);
              }
            });

            if (newIds.size > 0) {
              allNewActivityIds.set(dateString, newIds);
            }
          }

          days.push(dayData);
          previousWeekActivityIdsRef.current.set(dateString, currentActivityIds);
        } else {
          // Create empty day entry
          days.push({
            id: dateString,
            date: date,
            events: [],
          });
          if (!isInitialLoad) {
            previousWeekActivityIdsRef.current.set(dateString, new Set());
          }
        }
      });

      setWeekDays(days);

      // Update new activity IDs set with all new IDs from all days
      if (!isInitialLoad && allNewActivityIds.size > 0) {
        const combinedNewIds = new Set<string>();
        allNewActivityIds.forEach((ids, dateString) => {
          ids.forEach((id) => {
            combinedNewIds.add(`${dateString}-${id}`);
          });
        });
        setNewActivityIds(combinedNewIds);

        // Clear animation classes after animation completes
        setTimeout(() => {
          setNewActivityIds((prev) => {
            const updated = new Set(prev);
            combinedNewIds.forEach((id) => updated.delete(id));
            return updated;
          });
        }, 600);
      }

      // Mark initial load as complete after first render
      if (isInitialLoad && loadedRef.count === 7) {
        isInitialLoad = false;
      }
    };

    // Set up listeners for each day
    weekDates.forEach((date, index) => {
      const dateString = dateToDateString(date);
      const dayRef = doc(db, 'users', user.uid, 'days', dateString);

      const unsubscribe = onSnapshot(
        dayRef,
        (snapshot) => {
          if (snapshot.exists()) {
            daysData[index] = docToDay(snapshot.id, snapshot.data());
          } else {
            daysData[index] = {
              id: dateString,
              date: date,
              events: [],
            };
          }
          loadedRef.count++;
          updateWeekDays();
        },
        (error) => {
          console.error(`Error loading day ${dateString}:`, error);
          daysData[index] = {
            id: dateString,
            date: date,
            events: [],
          };
          loadedRef.count++;
          updateWeekDays();
        }
      );

      weekUnsubscribesRef.current.push(unsubscribe);
    });

    // Cleanup function
    return () => {
      weekUnsubscribesRef.current.forEach((unsubscribe) => unsubscribe());
      weekUnsubscribesRef.current = [];
    };
  }, [selectedDate, rangeType, user]);

  const reloadActivities = async () => {
    // No-op - real-time listeners handle updates automatically
  };

  return {
    displayedActivities,
    weekDays,
    loading: rangeType === 'day' ? dayLoading : false,
    reloadActivities,
    newActivityIds,
  };
}
