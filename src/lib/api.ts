import axios from 'axios';

// --- Configuration ---
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 60000, // 60 seconds
    headers: {
        'X-API-Key': API_KEY,
    },
});

// Add a request interceptor to log the auth header for debugging
apiClient.interceptors.request.use((config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    console.log('[API Headers]', config.headers);
    return config;
});

// --- Types ---
export interface StandardResponse {
    status: string;
    message: string;
}

export interface IngestTextRequest {
    text: string;
    sessionId: string;
}

export interface ChatRequest {
    question: string;
    sessionId: string;
}

export interface ChatResponse {
    response: string;
}

export interface WipeSessionRequest {
    sessionId: string;
}

export interface StatusResponse {
    isEmpty: boolean;
}

// --- API Functions ---

/**
 * Health Check
 * GET /health
 */
export const checkHealth = async (): Promise<boolean> => {
    try {
        const response = await apiClient.get('/health');
        // Assuming the health endpoint returns 200 OK for healthy
        return response.status === 200;
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
};

/**
 * Ingest Document (PDF/Text)
 * POST /ingest
 */
export const ingestFile = async (
    file: File,
    sessionId: string
): Promise<StandardResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);

    const response = await apiClient.post<StandardResponse>('/ingest', formData);
    return response.data;
};

/**
 * Ingest Raw Text
 * POST /ingest/text
 */
export const ingestText = async (
    text: string,
    sessionId: string
): Promise<StandardResponse> => {
    const response = await apiClient.post<StandardResponse>('/ingest/text', {
        text,
        sessionId,
    });
    return response.data;
};

/**
 * Chat with RAG
 * POST /chat
 */
export const chat = async (
    question: string,
    sessionId: string
): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/chat', {
        question,
        sessionId,
    });
    return response.data;
};

/**
 * Wipe Session Data
 * POST /wipe
 */
export const wipeSession = async (
    sessionId: string
): Promise<StandardResponse> => {
    const response = await apiClient.post<StandardResponse>('/wipe', {
        sessionId,
    });
    return response.data;
};

/**
 * Get Session Status
 * GET /status
 */
export const getSessionStatus = async (
    sessionId: string
): Promise<StatusResponse> => {
    const response = await apiClient.get<StatusResponse>('/status', {
        params: { sessionId },
    });
    return response.data;
};
