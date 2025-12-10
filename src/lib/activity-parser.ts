/**
 * Activity parsing logic for voice transcriptions
 * Detects activities and quantities from natural language input
 */

import { extractNumberBeforeWord, extractAnyNumber, wordToNumber } from './voice-parsing';

const TIME_UNITS = ['min', 'minute', 'minutes', 'mins', 'hour', 'hours', 'hr', 'hrs', 'second', 'seconds', 'sec', 'secs'];
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
    'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

interface ActivityPattern {
    keywords: string[];
    patterns: {
        numeric: RegExp;
        written: { number: string; fullMatch: string } | null;
    };
    activityName: string;
    unit: string;
    allowNoQuantity?: boolean;
}

interface ActivityKeyword {
    keyword: string;
    unit?: string;
    name?: string;
}

type DetectActivityCallback = (activityName: string, quantity?: string, unit?: string) => boolean;

/**
 * Normalize activity name (handle special cases)
 */
function normalizeActivityName(activity: string): string {
    const lower = activity.toLowerCase();
    if (lower === 'push' || lower === 'pushs') {
        return 'Pushups';
    }
    return activity.charAt(0).toUpperCase() + activity.slice(1);
}

/**
 * Parse specific activity patterns (pushups, sit-ups, meditation)
 */
function parseSpecificPatterns(
    text: string,
    lowerText: string,
    detectActivity: DetectActivityCallback
): boolean {
    const specificPatterns: ActivityPattern[] = [
        // Pushups
        {
            keywords: ['pushup', 'push-up', 'pushs'],
            patterns: {
                numeric: /(\d+)\s*(?:pushup|push-ups?|pushs)/i,
                written: extractNumberBeforeWord(text, '(?:pushup|push-ups?|pushs)'),
            },
            activityName: 'Pushups',
            unit: 'reps',
        },
        // Sit ups
        {
            keywords: ['situp', 'sit up'],
            patterns: {
                numeric: /(\d+)\s*(?:situp|sit-ups?|sit\s+ups?)/i,
                written: extractNumberBeforeWord(text, '(?:situp|sit-ups?|sit\\s+ups?)'),
            },
            activityName: 'Sit Ups',
            unit: 'reps',
        },
        // Meditation
        {
            keywords: ['meditat'],
            patterns: {
                numeric: /(\d+)\s*(?:min|minute|mins?)/i,
                written: extractNumberBeforeWord(text, '(?:min|minute|mins?)'),
            },
            activityName: 'Meditated',
            unit: 'mins',
            allowNoQuantity: true,
        },
    ];

    for (const pattern of specificPatterns) {
        if (pattern.keywords.some(keyword => lowerText.includes(keyword))) {
            // Try numeric
            const numericMatch = text.match(pattern.patterns.numeric);
            if (numericMatch) {
                if (detectActivity(pattern.activityName, numericMatch[1], pattern.unit)) return true;
            }

            // Try written
            if (pattern.patterns.written) {
                if (detectActivity(pattern.activityName, pattern.patterns.written.number, pattern.unit)) return true;
            }

            // Allow no quantity for meditation
            if (pattern.allowNoQuantity && detectActivity(pattern.activityName)) return true;
        }
    }

    return false;
}

/**
 * Parse time-based activities: "20 minute walk", "30 minute run", etc.
 */
function parseTimeBasedActivities(
    text: string,
    detectActivity: DetectActivityCallback
): boolean {
    // Try numeric first
    const timeBasedNumericMatch = text.match(/(?:went\s+for\s+a\s+)?(\d+)\s+(?:min|minute|mins?)\s+(\w+)/i);
    if (timeBasedNumericMatch) {
        const activityName = normalizeActivityName(timeBasedNumericMatch[2]);
        if (detectActivity(activityName, timeBasedNumericMatch[1], 'mins')) return true;
    }

    // Try written numbers for time-based activities
    const timeWrittenMatch = extractNumberBeforeWord(text, '(?:min|minute|mins?)');
    if (timeWrittenMatch) {
        const afterMinute = text.substring(
            text.toLowerCase().indexOf(timeWrittenMatch.fullMatch.toLowerCase()) + timeWrittenMatch.fullMatch.length
        ).trim();
        const activityMatch = afterMinute.match(/^(\w+)/);
        if (activityMatch) {
            const activityName = normalizeActivityName(activityMatch[1]);
            if (detectActivity(activityName, timeWrittenMatch.number, 'mins')) return true;
        }
    }

    return false;
}

/**
 * Parse general patterns: "I just did X [activity]" or "I did X [activity]"
 */
function parseGeneralPatterns(
    text: string,
    detectActivity: DetectActivityCallback
): boolean {
    // Try numeric first
    const generalNumericMatch = text.match(/(?:I\s+(?:just\s+)?did|completed|finished)\s+(\d+)\s+(\w+)/i);
    if (generalNumericMatch) {
        const activityName = normalizeActivityName(generalNumericMatch[2]);
        if (detectActivity(activityName, generalNumericMatch[1])) return true;
    }

    // Try written numbers in general pattern
    for (const word of NUMBER_WORDS) {
        const pattern = new RegExp(`(?:I\\s+(?:just\\s+)?did|completed|finished)\\s+${word}\\s+(\\w+)`, 'i');
        const match = text.match(pattern);
        if (match) {
            const num = wordToNumber(word);
            if (num) {
                const activityName = normalizeActivityName(match[1]);
                if (detectActivity(activityName, num)) return true;
            }
        }
    }

    // Try compound numbers in general pattern
    const compoundGeneralMatch = text.match(/(?:I\s+(?:just\s+)?did|completed|finished)\s+(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[-\s]+(one|two|three|four|five|six|seven|eight|nine)\s+(\w+)/i);
    if (compoundGeneralMatch) {
        const tens = wordToNumber(compoundGeneralMatch[1]);
        const ones = wordToNumber(compoundGeneralMatch[2]);
        if (tens && ones) {
            const total = parseInt(tens) + parseInt(ones);
            const activityName = normalizeActivityName(compoundGeneralMatch[3]);
            if (detectActivity(activityName, total.toString())) return true;
        }
    }

    return false;
}

/**
 * Parse simple patterns: "X [activity]" - just number and activity
 */
function parseSimplePatterns(
    text: string,
    detectActivity: DetectActivityCallback
): boolean {
    // Try numeric first
    const simpleNumericMatch = text.match(/(\d+)\s+(\w+)/i);
    if (simpleNumericMatch) {
        const activity = simpleNumericMatch[2].toLowerCase();
        if (!TIME_UNITS.includes(activity)) {
            const activityName = normalizeActivityName(activity);
            if (detectActivity(activityName, simpleNumericMatch[1])) return true;
        }
    }

    // Try written numbers in simple pattern
    for (const word of NUMBER_WORDS) {
        const pattern = new RegExp(`\\b${word}\\s+(\\w+)`, 'i');
        const match = text.match(pattern);
        if (match) {
            const num = wordToNumber(word);
            if (num) {
                const activity = match[1].toLowerCase();
                if (!TIME_UNITS.includes(activity)) {
                    const activityName = normalizeActivityName(activity);
                    if (detectActivity(activityName, num)) return true;
                }
            }
        }
    }

    // Try compound numbers in simple pattern
    const compoundSimpleMatch = text.match(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[-\s]+(one|two|three|four|five|six|seven|eight|nine)\s+(\w+)/i);
    if (compoundSimpleMatch) {
        const tens = wordToNumber(compoundSimpleMatch[1]);
        const ones = wordToNumber(compoundSimpleMatch[2]);
        if (tens && ones) {
            const total = parseInt(tens) + parseInt(ones);
            const activity = compoundSimpleMatch[3].toLowerCase();
            if (!TIME_UNITS.includes(activity)) {
                const activityName = normalizeActivityName(activity);
                if (detectActivity(activityName, total.toString())) return true;
            }
        }
    }

    return false;
}

/**
 * Parse fallback patterns: try to extract any activity mentioned with keywords
 */
function parseFallbackPatterns(
    text: string,
    lowerText: string,
    detectActivity: DetectActivityCallback
): boolean {
    const activityKeywords: ActivityKeyword[] = [
        { keyword: 'run', unit: 'miles' },
        { keyword: 'walk', unit: 'miles' },
        { keyword: 'exercise', unit: undefined },
        { keyword: 'situp', unit: 'reps', name: 'Sit-ups' },
        { keyword: 'sit up', unit: 'reps', name: 'Sit-ups' },
        { keyword: 'squat', unit: 'reps' },
        { keyword: 'pushs', unit: 'reps', name: 'Pushups' },
    ];

    for (const { keyword, unit, name } of activityKeywords) {
        if (lowerText.includes(keyword)) {
            const quantity = extractAnyNumber(text);
            const activityName = name || normalizeActivityName(keyword);
            if (detectActivity(activityName, quantity || undefined, unit)) return true;
        }
    }

    return false;
}

/**
 * Parse activity from transcribed text
 * Returns true if an activity was detected and handled
 */
export function parseActivity(
    text: string,
    onActivityDetected: (activity: string, quantity?: string, unit?: string, transcribedPhrase?: string) => void,
    isActivityActive?: (activityName: string) => boolean
): boolean {
    const lowerText = text.toLowerCase();

    // Helper function to check and detect activity
    const detectActivity: DetectActivityCallback = (activityName: string, quantity?: string, unit?: string): boolean => {
        if (isActivityActive && !isActivityActive(activityName)) {
            return false;
        }
        onActivityDetected(activityName, quantity, unit, text);
        return true;
    };

    // Try patterns in order of specificity
    if (parseSpecificPatterns(text, lowerText, detectActivity)) return true;
    if (parseTimeBasedActivities(text, detectActivity)) return true;
    if (parseGeneralPatterns(text, detectActivity)) return true;
    if (parseSimplePatterns(text, detectActivity)) return true;
    if (parseFallbackPatterns(text, lowerText, detectActivity)) return true;

    return false;
}
