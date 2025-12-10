/**
 * Utilities for parsing numbers from voice transcriptions
 * Handles both numeric digits and written number words
 */

// Number words for conversion
const NUMBER_WORDS = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
    'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
];

const NUMBER_WORD_MAP: { [key: string]: number } = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
    'eighty': 80, 'ninety': 90
};

/**
 * Convert a written number word to its numeric string representation
 */
export function wordToNumber(word: string): string | null {
    const lowerWord = word.toLowerCase().trim();
    const num = NUMBER_WORD_MAP[lowerWord];
    return num !== undefined ? num.toString() : null;
}

/**
 * Extract a number (digit or written) from text that appears before a specific word
 * Returns both the number and the full matched phrase
 */
export function extractNumberBeforeWord(
    text: string,
    beforeWord: string
): { number: string; fullMatch: string } | null {
    const lowerText = text.toLowerCase();
    const lowerBeforeWord = beforeWord.toLowerCase();

    // Try numeric digits first
    const digitPattern = new RegExp(`(\\d+)\\s+${lowerBeforeWord}`, 'i');
    const digitMatch = text.match(digitPattern);
    if (digitMatch) {
        return { number: digitMatch[1], fullMatch: digitMatch[0] };
    }

    // Try single word numbers
    for (const word of NUMBER_WORDS) {
        const pattern = new RegExp(`\\b${word}\\s+${lowerBeforeWord}`, 'i');
        const match = text.match(pattern);
        if (match) {
            const num = wordToNumber(word);
            if (num) {
                return { number: num, fullMatch: match[0] };
            }
        }
    }

    // Try compound numbers (twenty-one, thirty-five, etc.)
    const compoundPattern = new RegExp(
        `\\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[-\\s]+(one|two|three|four|five|six|seven|eight|nine)\\s+${lowerBeforeWord}`,
        'i'
    );
    const compoundMatch = text.match(compoundPattern);
    if (compoundMatch) {
        const tens = wordToNumber(compoundMatch[1]);
        const ones = wordToNumber(compoundMatch[2]);
        if (tens && ones) {
            const total = parseInt(tens) + parseInt(ones);
            return { number: total.toString(), fullMatch: compoundMatch[0] };
        }
    }

    return null;
}

/**
 * Extract any number from text (numeric, written, or compound)
 */
export function extractAnyNumber(text: string): string | null {
    // Try numeric first
    const numMatch = text.match(/(\d+)/);
    if (numMatch) {
        return numMatch[1];
    }

    // Try written numbers
    for (const word of NUMBER_WORDS) {
        const wordPattern = new RegExp(`\\b${word}\\b`, 'i');
        if (wordPattern.test(text)) {
            const num = wordToNumber(word);
            if (num) {
                return num;
            }
        }
    }

    // Try compound numbers
    const compoundPattern = /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[-\s]+(one|two|three|four|five|six|seven|eight|nine)\b/i;
    const compoundMatch = text.match(compoundPattern);
    if (compoundMatch) {
        const tens = wordToNumber(compoundMatch[1]);
        const ones = wordToNumber(compoundMatch[2]);
        if (tens && ones) {
            return (parseInt(tens) + parseInt(ones)).toString();
        }
    }

    return null;
}
