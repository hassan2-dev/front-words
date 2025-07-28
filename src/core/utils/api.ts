import { API_CONFIG, DEFAULT_HEADERS, ENDPOINTS } from '../config/api';
import { STORAGE_KEYS } from '../constants/app';
import type {
    AuthResponse,
    RegisterResponse,
    Word,
    Story,
    Lesson,
    Notification,
    Attendance,
    Review,
    ChatMessage,
    PaginatedResponse,
    ApiResponse,
    Achievement,
    UserAchievement,
    AchievementProgress,
    AchievementStats,
    LeaderboardEntry,
    AchievementType,
    AchievementActivityResponse,
    UserAchievementsResponse,
} from '../types';

// API Client Class
class ApiClient {
    private baseURL: string;
    private timeout: number;

    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
    }

    // Get auth token from storage
    private getAuthToken(): string | null {
        return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }

    // Create request headers
    private createHeaders(customHeaders?: Record<string, string>): HeadersInit {
        const headers: Record<string, string> = { ...DEFAULT_HEADERS };

        const token = this.getAuthToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return { ...headers, ...customHeaders };
    }

    // Handle API response
    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.message || `HTTP error! status: ${response.status}`,
                    achievements: [],
                    totalPoints: 0,
                };
            }

            return {
                success: true,
                data: data.data || data,
                message: data.message,
                achievements: data.achievements || [],
                totalPoints: data.totalPoints || 0,
            };
        }

        if (!response.ok) {
            return {
                success: false,
                error: `HTTP error! status: ${response.status}`,
                achievements: [],
                totalPoints: 0,
            };
        }

        return {
            success: true,
            achievements: [],
            totalPoints: 0,
        };
    }

    // Generic request method
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;

        const config: RequestInit = {
            ...options,
            headers: this.createHeaders(options.headers as Record<string, string>),
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            return this.handleResponse<T>(response);

        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    return {
                        success: false,
                        error: 'Request timeout',
                        achievements: [],
                        totalPoints: 0,
                    };
                }
                return {
                    success: false,
                    error: error.message,
                    achievements: [],
                    totalPoints: 0,
                };
            }

            return {
                success: false,
                error: 'Unknown error occurred',
                achievements: [],
                totalPoints: 0,
            };
        }
    }

    // HTTP Methods
    async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
        let url = endpoint;

        if (params) {
            const searchParams = new URLSearchParams();
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    searchParams.append(key, String(params[key]));
                }
            });
            url += `?${searchParams.toString()}`;
        }

        return this.request<T>(url, { method: 'GET' });
    }

    async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    // Upload file
    async uploadFile<T>(
        endpoint: string,
        file: File,
        fieldName = 'file'
    ): Promise<ApiResponse<T>> {
        const formData = new FormData();
        formData.append(fieldName, file);

        return this.request<T>(endpoint, {
            method: 'POST',
            body: formData,
            headers: {
                Authorization: `Bearer ${this.getAuthToken()}`,
            },
        });
    }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// --- AUTH ---
export const login = (data: { phone: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data);

export const register = (data: { name: string; phone: string; password: string; role: string; trainerId?: string; level?: string }) =>
    apiClient.post<RegisterResponse>('/auth/register', data);

// --- WORDS ---
export const addWord = (data: { word: string; meaning: string }) =>
    apiClient.post<ApiResponse<Word>>('/words', data);

export const getAllWords = () =>
    apiClient.get<ApiResponse<{ public: Word[]; private: Word[] }>>('/words/all');

export const getPrivateWords = () =>
    apiClient.get<ApiResponse<{ private: Word[] }>>('/words/private');

export const reviewWord = (id: string, data: { score: number; feedback: string }) =>
    apiClient.post<ApiResponse<Review>>(`/words/${id}/review`, data);

export const getDailyWords = () =>
    apiClient.get<{ words: any[] }>('/words/daily');

export const learnWord = (word: string) =>
    apiClient.post(`/words/${word}/learn`);

export const getLearnedWords = () =>
    apiClient.get<{ words: any[] }>('/words/learned');

// --- STORIES ---
export const getStories = (params?: { level?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.level) queryParams.append("level", params.level);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const url = `/stories${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return apiClient.get<PaginatedResponse<Story>>(url);
};

export const getPopularStories = () =>
    apiClient.get<ApiResponse<Story[]>>('/stories/popular');

export const getStoryById = (storyId: string) =>
    apiClient.get<ApiResponse<Story>>(`/stories/${storyId}`);

export const addStory = (data: { title: string; content: string; level: string }) =>
    apiClient.post<ApiResponse<Story>>('/stories', data);

// --- LESSONS (Trainer) ---
export const addLesson = (data: { title: string; content: string }) =>
    apiClient.post<ApiResponse<Lesson>>('/trainer/lessons', data);

export const getLessons = () =>
    apiClient.get<ApiResponse<Lesson[]>>('/trainer/lessons');

// --- NOTIFICATIONS ---
export const getNotifications = () =>
    apiClient.get<ApiResponse<Notification[]>>('/notifications');

export const addNotification = (data: { userId: string; title: string; message: string }) =>
    apiClient.post<ApiResponse>('/notifications', data);

// --- ATTENDANCE ---
export const addAttendance = (data: { note?: string; type: string }) =>
    apiClient.post<ApiResponse<Attendance>>('/attendance', data);

export const getAttendance = () =>
    apiClient.get<ApiResponse<Attendance[]>>('/attendance');

// --- CHAT ---
export const sendChatMessage = (data: { message: string; type: string; language: string; context?: string }) =>
    apiClient.post<ApiResponse<{ messageId: string; response: string; timestamp: string }>>('/chat/send', data);

export const getChatHistory = (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<{ messages: ChatMessage[]; total: number; page: number; limit: number }>>('/chat/history', params);

export const getChatRemainingRequests = () =>
    apiClient.get<ApiResponse<{ remaining: number }>>('/chat/remaining-requests');

// --- AI ---
export const generateStoryFromWords = (data: { words: string[]; level: string; language?: string }) =>
    apiClient.post<ApiResponse<{
        story: string;
        translation: string;
        highlighted_words: string[];
        level: string;
        language: string;
        isExisting: boolean;
    }>>('/ai/generate/story-from-words', data);

export const getAIRemainingRequests = () =>
    apiClient.get<ApiResponse<{ storyRequests: number; chatRequests: number }>>('/ai/remaining-requests');

export const generateWordsByTopic = (data: { topic: string; level: string }) =>
    apiClient.post<ApiResponse<string[]>>('/ai/generate-words', data);

export const generateSimpleStory = (data: { words: string[]; level: string }) =>
    apiClient.post<ApiResponse<{ story: string; translation: string }>>('/ai/generate-story', data);

// --- DAILY STORIES ---
export const getDailyStory = (data: { publicWords: string[]; privateWords: string[]; level: string }) =>
    apiClient.post<ApiResponse<Story>>('/stories/daily', data);

export const generateDailyStory = (data: { publicWords: string[]; privateWords: string[]; userName: string; level: string }) =>
    apiClient.post<ApiResponse<Story>>('/stories/daily/generate', data);

export const completeDailyStory = (data: { storyId: string; level: string; points: number }) =>
    apiClient.post<ApiResponse<any>>('/stories/daily/complete', data);

// --- REVIEWS ---
export const getReviews = () =>
    apiClient.get<ApiResponse<Review[]>>('/reviews');

// --- ACTIVITIES ---
// Progress
export const addProgress = (data: { completedLessons: number; totalLessons: number; progressPercent: number }) =>
    apiClient.post<ApiResponse<any>>('/activities/progress', data);

export const getProgress = () =>
    apiClient.get<ApiResponse<{ completedLessons: number; totalLessons: number; progressPercent: number }>>('/activities/progress');

// --- ACHIEVEMENTS ---
// Student Achievements
export const getMyAchievements = (params?: { userId?: string }) =>
    apiClient.get<ApiResponse<UserAchievementsResponse>>(ENDPOINTS.ACHIEVEMENTS.MY, params);

export const getMyAchievementProgress = (params?: { userId?: string }) =>
    apiClient.get<ApiResponse<AchievementProgress>>(ENDPOINTS.ACHIEVEMENTS.MY_PROGRESS, params);

export const getMyRecentAchievements = (params?: { userId?: string; limit?: number }) =>
    apiClient.get<ApiResponse<UserAchievement[]>>(ENDPOINTS.ACHIEVEMENTS.MY_RECENT, params);

export const getLeaderboard = (params?: { limit?: number }) =>
    apiClient.get<ApiResponse<LeaderboardEntry[]>>(ENDPOINTS.ACHIEVEMENTS.LEADERBOARD, params);

// Activity Registration
export const completeStory = (data: { userId: string; storyId: string; level: string; points: number }) =>
    apiClient.post<AchievementActivityResponse>(ENDPOINTS.ACHIEVEMENTS.COMPLETE_STORY, data);

export const completeDailyWords = (data: { userId: string; date: string; count: number }) =>
    apiClient.post<AchievementActivityResponse>(ENDPOINTS.ACHIEVEMENTS.COMPLETE_DAILY_WORDS, data);

export const addPrivateWordsAchievement = (data: { userId: string; count: number }) =>
    apiClient.post<AchievementActivityResponse>(ENDPOINTS.ACHIEVEMENTS.ADD_PRIVATE_WORDS, data);

export const learnWordsAchievement = (data: { userId: string; count: number; type: string }) =>
    apiClient.post<AchievementActivityResponse>(ENDPOINTS.ACHIEVEMENTS.LEARN_WORDS, data);

export const studyStreakAchievement = (data: { userId: string; streakDays: number }) =>
    apiClient.post<AchievementActivityResponse>(ENDPOINTS.ACHIEVEMENTS.STUDY_STREAK, data);

// Admin Management
export const getAllAchievements = () =>
    apiClient.get<ApiResponse<Achievement[]>>(ENDPOINTS.ACHIEVEMENTS.ALL);

export const getAchievementStats = () =>
    apiClient.get<ApiResponse<AchievementStats>>(ENDPOINTS.ACHIEVEMENTS.STATS);

export const addAchievement = (data: Partial<Achievement>) =>
    apiClient.post<ApiResponse<Achievement>>(ENDPOINTS.ACHIEVEMENTS.ADD, data);

export const updateAchievement = (id: string, data: Partial<Achievement>) =>
    apiClient.put<ApiResponse<Achievement>>(ENDPOINTS.ACHIEVEMENTS.UPDATE(id), data);

export const deleteAchievement = (id: string) =>
    apiClient.delete<ApiResponse>(ENDPOINTS.ACHIEVEMENTS.DELETE(id));

// Types and Management
export const getAchievementTypes = () =>
    apiClient.get<ApiResponse<AchievementType[]>>(ENDPOINTS.ACHIEVEMENTS.TYPES);

export const getUserAchievements = (userId: string) =>
    apiClient.get<ApiResponse<UserAchievement[]>>(ENDPOINTS.ACHIEVEMENTS.USER_ACHIEVEMENTS(userId));

export const resetUserAchievements = (userId: string) =>
    apiClient.post<ApiResponse>(ENDPOINTS.ACHIEVEMENTS.RESET_USER(userId), {});

// Words Learned
export const addWordsLearned = (data: { count: number; period: string }) =>
    apiClient.post<ApiResponse<any>>('/activities/words-learned', data);

export const getWordsLearned = (period: string = 'month') =>
    apiClient.get<ApiResponse<{ count: number; period: string }>>('/activities/words-learned', { period });

// --- ACHIEVEMENTS ---
export const addStreak = (data: { streak: number; lastDate: string }) =>
    apiClient.post<ApiResponse<any>>('/activities/streak', data);

export const getStreak = () =>
    apiClient.get<ApiResponse<{ streak: number; lastDate: string }>>('/activities/streak');

// Utility functions
export const buildEndpoint = (template: string, params: Record<string, string>): string => {
    let endpoint = template;
    Object.keys(params).forEach(key => {
        endpoint = endpoint.replace(`:${key}`, params[key]);
    });
    return endpoint;
};

export const isApiError = (response: ApiResponse): boolean => {
    return !response.success;
};

export const getApiErrorMessage = (response: ApiResponse): string => {
    return response.error || 'حدث خطأ غير متوقع';
}; 