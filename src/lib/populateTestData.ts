import { createOrUpdateDay, dateToDateString } from './days';
import { DEFAULT_ACTIVITIES } from './activities';
import type { Activity } from '@/types/activity';
import type { DayData } from '@/types/day';

/**
 * Generate a random activity ID similar to how activities are created in the app
 */
function generateActivityId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate a random number between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random timestamp within a specific day
 * @param date - The date to generate a timestamp for
 * @param hourMin - Minimum hour (0-23)
 * @param hourMax - Maximum hour (0-23)
 */
function randomTimestampInDay(date: Date, hourMin: number = 6, hourMax: number = 22): Date {
  const timestamp = new Date(date);
  timestamp.setHours(randomInt(hourMin, hourMax));
  timestamp.setMinutes(randomInt(0, 59));
  timestamp.setSeconds(randomInt(0, 59));
  timestamp.setMilliseconds(0);
  return timestamp;
}

/**
 * Generate test activities for a day
 * @param date - The date to generate activities for
 * @returns Array of activities
 */
function generateActivitiesForDay(date: Date): Activity[] {
  const activities: Activity[] = [];
  const activityNames = DEFAULT_ACTIVITIES.map(a => a.name);

  // Generate 2-5 activities per day
  const numActivities = randomInt(2, 5);

  // Generate timestamps spread throughout the day to avoid collisions
  const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  const selectedHours: number[] = [];

  // Randomly select unique hours for activities
  while (selectedHours.length < numActivities && hours.length > 0) {
    const randomIndex = randomInt(0, hours.length - 1);
    selectedHours.push(hours.splice(randomIndex, 1)[0]);
  }

  // Sort hours to ensure chronological order
  selectedHours.sort((a, b) => a - b);

  for (let i = 0; i < numActivities; i++) {
    const activityName = activityNames[randomInt(0, activityNames.length - 1)];
    const hour = selectedHours[i] || randomInt(6, 22);
    const timestamp = randomTimestampInDay(date, hour, hour);

    // Some activities have quantities (like pushups, sit-ups, squats)
    const hasQuantity = ['Pushups', 'Sit-ups', 'Squats'].includes(activityName);
    const quantity = hasQuantity ? randomInt(5, 50).toString() : undefined;
    const unit = hasQuantity ? 'reps' : undefined;

    activities.push({
      id: generateActivityId(),
      name: activityName,
      quantity,
      unit,
      timestamp,
      transcribedPhrase: `I did ${activityName.toLowerCase()}${quantity ? ` ${quantity} ${unit}` : ''}`,
    });
  }

  // Sort activities by timestamp (earliest first)
  return activities.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Populate the database with test data for 7 days before the current date
 * @param userId - The user ID to populate data for
 */
export async function populateTestData(userId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const promises: Promise<any>[] = [];

  // Generate data for 7 days before today (days -7 through -1)
  for (let i = 7; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const activities = generateActivitiesForDay(date);
    const dateString = dateToDateString(date);

    const dayData: DayData = {
      date,
      events: activities,
      createdAt: date, // Set createdAt to the date itself for realism
      updatedAt: date,
    };

    promises.push(createOrUpdateDay(userId, dateString, dayData));
  }

  await Promise.all(promises);
  console.log(`Successfully populated test data for 7 days for user ${userId}`);
}
