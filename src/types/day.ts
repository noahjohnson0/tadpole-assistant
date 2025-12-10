import { Activity } from './activity';

/**
 * Represents a day document in the days subcollection
 * Each day belongs to a user and contains a list of events (activities)
 */
export interface Day {
  id: string; // Document ID (typically a date string like "2024-01-15")
  date: Date; // The date this day represents
  events: Activity[]; // List of activities/events recorded for this day
  createdAt?: Date; // When the day document was created
  updatedAt?: Date; // When the day document was last updated
}

/**
 * Data structure for creating/updating a day document
 */
export interface DayData {
  date: Date;
  events: Activity[];
  createdAt?: Date;
  updatedAt?: Date;
}
