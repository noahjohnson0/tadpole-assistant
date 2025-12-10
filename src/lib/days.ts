import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import type { Day, DayData } from "@/types/day";
import type { Activity } from "@/types/activity";

const DAYS_SUBCOLLECTION = "days";

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
    date: timestampToDate(data.date),
    events: (data.events || []).map((event: any) => ({
      id: event.id,
      name: event.name,
      quantity: event.quantity,
      unit: event.unit,
      timestamp: timestampToDate(event.timestamp),
      transcribedPhrase: event.transcribedPhrase,
    })),
    createdAt: data.createdAt ? timestampToDate(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? timestampToDate(data.updatedAt) : undefined,
  };
}

/**
 * Get a day document for a specific user and date
 * @param userId - The user's document ID
 * @param dateString - Date string in format "YYYY-MM-DD" (used as document ID)
 */
export async function getDayByDate(
  userId: string,
  dateString: string
): Promise<Day | null> {
  try {
    const dayRef = doc(db, "users", userId, DAYS_SUBCOLLECTION, dateString);
    const dayDoc = await getDoc(dayRef);

    if (!dayDoc.exists()) {
      return null;
    }

    return docToDay(dayDoc.id, dayDoc.data());
  } catch (error) {
    console.error("Error getting day:", error);
    throw error;
  }
}

/**
 * Get all days for a user
 * @param userId - The user's document ID
 */
export async function getAllDays(userId: string): Promise<Day[]> {
  try {
    const daysRef = collection(db, "users", userId, DAYS_SUBCOLLECTION);
    const querySnapshot = await getDocs(daysRef);

    return querySnapshot.docs.map((doc) => docToDay(doc.id, doc.data()));
  } catch (error) {
    console.error("Error getting all days:", error);
    throw error;
  }
}

/**
 * Create or update a day document
 * @param userId - The user's document ID
 * @param dayData - The day data to create/update
 * @param dateString - Date string in format "YYYY-MM-DD" (used as document ID)
 */
export async function createOrUpdateDay(
  userId: string,
  dateString: string,
  dayData: DayData
): Promise<Day> {
  try {
    const dayRef = doc(db, "users", userId, DAYS_SUBCOLLECTION, dateString);
    const now = Timestamp.now();

    const data: any = {
      date: Timestamp.fromDate(dayData.date),
      events: dayData.events.map((event) => ({
        id: event.id,
        name: event.name,
        quantity: event.quantity || null,
        unit: event.unit || null,
        timestamp: Timestamp.fromDate(event.timestamp),
        transcribedPhrase: event.transcribedPhrase || null,
      })),
      updatedAt: now,
    };

    // Only set createdAt if this is a new document
    const existingDoc = await getDoc(dayRef);
    if (!existingDoc.exists()) {
      data.createdAt = dayData.createdAt
        ? Timestamp.fromDate(dayData.createdAt)
        : now;
    }

    await setDoc(dayRef, data, { merge: true });
    return docToDay(dateString, data);
  } catch (error) {
    console.error("Error creating/updating day:", error);
    throw error;
  }
}

/**
 * Add an event (activity) to a day
 * @param userId - The user's document ID
 * @param dateString - Date string in format "YYYY-MM-DD"
 * @param activity - The activity to add
 */
export async function addEventToDay(
  userId: string,
  dateString: string,
  activity: Activity
): Promise<void> {
  try {
    const dayRef = doc(db, "users", userId, DAYS_SUBCOLLECTION, dateString);
    const now = Timestamp.now();

    const eventData = {
      id: activity.id,
      name: activity.name,
      quantity: activity.quantity || null,
      unit: activity.unit || null,
      timestamp: Timestamp.fromDate(activity.timestamp),
      transcribedPhrase: activity.transcribedPhrase || null,
    };

    // Check if day exists, if not create it
    const dayDoc = await getDoc(dayRef);
    if (!dayDoc.exists()) {
      // Create the day document with the event
      const date = new Date(dateString);
      date.setHours(0, 0, 0, 0);

      await setDoc(dayRef, {
        date: Timestamp.fromDate(date),
        events: [eventData],
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // Add event to existing day
      await updateDoc(dayRef, {
        events: arrayUnion(eventData),
        updatedAt: now,
      });
    }
  } catch (error) {
    console.error("Error adding event to day:", error);
    throw error;
  }
}

/**
 * Remove an event (activity) from a day
 * @param userId - The user's document ID
 * @param dateString - Date string in format "YYYY-MM-DD"
 * @param activity - The activity to remove (must match exactly)
 */
export async function removeEventFromDay(
  userId: string,
  dateString: string,
  activity: Activity
): Promise<void> {
  try {
    const dayRef = doc(db, "users", userId, DAYS_SUBCOLLECTION, dateString);
    const now = Timestamp.now();

    const eventData = {
      id: activity.id,
      name: activity.name,
      quantity: activity.quantity || null,
      unit: activity.unit || null,
      timestamp: Timestamp.fromDate(activity.timestamp),
      transcribedPhrase: activity.transcribedPhrase || null,
    };

    await updateDoc(dayRef, {
      events: arrayRemove(eventData),
      updatedAt: now,
    });
  } catch (error) {
    console.error("Error removing event from day:", error);
    throw error;
  }
}

/**
 * Update an event (activity) in a day
 * @param userId - The user's document ID
 * @param dateString - Date string in format "YYYY-MM-DD"
 * @param oldActivity - The original activity to replace
 * @param updatedActivity - The updated activity
 */
export async function updateEventInDay(
  userId: string,
  dateString: string,
  oldActivity: Activity,
  updatedActivity: Activity
): Promise<void> {
  try {
    const dayRef = doc(db, "users", userId, DAYS_SUBCOLLECTION, dateString);
    const now = Timestamp.now();

    const oldEventData = {
      id: oldActivity.id,
      name: oldActivity.name,
      quantity: oldActivity.quantity || null,
      unit: oldActivity.unit || null,
      timestamp: Timestamp.fromDate(oldActivity.timestamp),
    };

    const updatedEventData = {
      id: updatedActivity.id,
      name: updatedActivity.name,
      quantity: updatedActivity.quantity || null,
      unit: updatedActivity.unit || null,
      timestamp: Timestamp.fromDate(updatedActivity.timestamp),
    };

    // Remove old event and add updated event
    await updateDoc(dayRef, {
      events: arrayRemove(oldEventData),
      updatedAt: now,
    });

    await updateDoc(dayRef, {
      events: arrayUnion(updatedEventData),
      updatedAt: now,
    });
  } catch (error) {
    console.error("Error updating event in day:", error);
    throw error;
  }
}

/**
 * Get today's date string in format "YYYY-MM-DD"
 */
export function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

/**
 * Convert a Date to date string in format "YYYY-MM-DD"
 */
export function dateToDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}
