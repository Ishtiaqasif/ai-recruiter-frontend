import { v4 as uuidv4 } from 'uuid';

export const getOrCreateSessionId = (): string => {
    if (typeof window === 'undefined') {
        return '';
    }

    const STORAGE_KEY = 'ai_recruiter_session_id';
    let sessionId = localStorage.getItem(STORAGE_KEY);

    if (!sessionId) {
        sessionId = uuidv4();
        localStorage.setItem(STORAGE_KEY, sessionId);
    }

    return sessionId;
};
