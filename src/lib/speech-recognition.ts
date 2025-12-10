/**
 * Speech recognition utilities and setup
 */

export interface SpeechRecognitionHandlers {
    onStart?: () => void;
    onResult?: (event: SpeechRecognitionEvent) => void;
    onError?: (event: SpeechRecognitionErrorEvent) => void;
    onEnd?: () => void;
}

/**
 * Get the SpeechRecognition constructor from the browser
 */
export function getSpeechRecognition(): (typeof window.SpeechRecognition) | null {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

/**
 * Create and configure a SpeechRecognition instance
 */
export function createSpeechRecognition(
    handlers: SpeechRecognitionHandlers
): SpeechRecognition | null {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
        return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    if (handlers.onStart) {
        recognition.onstart = handlers.onStart;
    }

    if (handlers.onResult) {
        recognition.onresult = handlers.onResult;
    }

    if (handlers.onError) {
        recognition.onerror = handlers.onError;
    }

    if (handlers.onEnd) {
        recognition.onend = handlers.onEnd;
    }

    return recognition;
}
