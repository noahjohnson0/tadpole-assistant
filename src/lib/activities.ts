import { TrackedActivity } from '@/types/tracked-activity';

// Default activities that users can track
export const DEFAULT_ACTIVITIES: Omit<TrackedActivity, 'id'>[] = [
  { name: 'Pushups', active: true, keywords: ['pushup', 'push-ups', 'push ups'] },
  { name: 'Meditated', active: true, keywords: ['meditat', 'meditation'] },
  { name: 'Run', active: true, keywords: ['run', 'running', 'ran'] },
  { name: 'Walk', active: true, keywords: ['walk', 'walking', 'walked'] },
  { name: 'Sit-ups', active: true, keywords: ['situp', 'sit-up', 'sit ups', 'situps'] },
  { name: 'Squats', active: true, keywords: ['squat', 'squats'] },
];

/**
 * Normalizes an activity name to match the canonical name from tracked activities.
 * 
 * @param activityName - The activity name to normalize (may be a variation)
 * @param trackedActivities - Array of tracked activities to match against
 * @returns The canonical activity name from tracked activities, or the original name if no match is found
 */
export function normalizeActivityName(
  activityName: string,
  trackedActivities: TrackedActivity[]
): string {
  if (!activityName || trackedActivities.length === 0) {
    return activityName;
  }

  const lowerActivityName = activityName.toLowerCase().trim();

  // Normalize spaces and hyphens for better matching
  // Replace multiple spaces/hyphens with single space, then normalize
  const normalizedInput = lowerActivityName.replace(/[\s-]+/g, ' ').trim();

  // First, try exact match (case-insensitive, ignoring spaces/hyphens)
  const exactMatch = trackedActivities.find((tracked) => {
    const normalizedTracked = tracked.name.toLowerCase().replace(/[\s-]+/g, ' ').trim();
    return normalizedTracked === normalizedInput;
  });
  if (exactMatch) {
    return exactMatch.name;
  }

  // Then, try keyword matching
  for (const tracked of trackedActivities) {
    if (tracked.keywords) {
      // Check if any keyword matches (normalizing spaces/hyphens)
      const matchesKeyword = tracked.keywords.some((keyword) => {
        const normalizedKeyword = keyword.toLowerCase().replace(/[\s-]+/g, ' ').trim();
        // Check if activity name contains keyword or keyword contains activity name
        // Also handle pluralization: "walks" should match "walk" keyword
        const inputStem = normalizedInput.replace(/s$/, ''); // Remove trailing 's' for plural matching
        const keywordStem = normalizedKeyword.replace(/s$/, ''); // Remove trailing 's' for plural matching
        return normalizedInput.includes(normalizedKeyword) ||
          normalizedKeyword.includes(normalizedInput) ||
          inputStem === keywordStem ||
          normalizedInput === normalizedKeyword + 's' ||
          normalizedInput + 's' === normalizedKeyword;
      });
      if (matchesKeyword) {
        return tracked.name;
      }
    }
  }

  // No match found, return original name
  return activityName;
}

/**
 * Validates that an activity name exists in the tracked activities list
 * @param activityName - The activity name to validate
 * @param trackedActivities - Array of tracked activities to check against
 * @returns true if the activity name matches a tracked activity (exact match)
 */
export function isValidTrackedActivity(
  activityName: string,
  trackedActivities: TrackedActivity[]
): boolean {
  if (!activityName || trackedActivities.length === 0) {
    return false;
  }

  const lowerActivityName = activityName.toLowerCase().trim();

  return trackedActivities.some((tracked) =>
    tracked.name.toLowerCase() === lowerActivityName
  );
}
