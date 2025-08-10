import { API_ENDPOINTS, getApiUrl, getDynamicApiUrl } from '../config/api';
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
    DailyStory,
    DailyStoryWord,
    WordStatusUpdate,
    CanProceedResponse,
    DailyStoryComplete,
} from '../types';

// API Client Class
class ApiClient {
    private baseURL: string;
    private timeout: number;

    constructor() {
        // استخدام متغيرات البيئة أو القيم الافتراضية
        this.baseURL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
        this.timeout = parseInt((import.meta as any).env?.VITE_API_TIMEOUT || '180000'); // 180 ثانية (3 دقائق) للـ GPT-4 (دقيقة ونصف + buffer)
    }



    // Get auth token from storage
    private getAuthToken(): string | null {
        return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }

    // Create request headers
    private createHeaders(customHeaders?: Record<string, string>): HeadersInit {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

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
        const url = getApiUrl(endpoint);
        console.log(`API Request: ${options.method || 'GET'} ${url}`);

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
    apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data);

export const register = (data: { name: string; phone: string; password: string; role: string; trainerId?: string; level?: string }) =>
    apiClient.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, data);

export const getProfile = () =>
    apiClient.get<AuthResponse>(API_ENDPOINTS.AUTH.PROFILE);

export const updateProfile = (data: any) =>
    apiClient.put<AuthResponse>(API_ENDPOINTS.AUTH.UPDATE_PROFILE, data);

export const createDefaultUsers = () =>
    apiClient.post<ApiResponse>(API_ENDPOINTS.AUTH.CREATE_DEFAULT_USERS, {});

// --- WORDS ---
export const addWord = (data: { word: string; meaning: string }) =>
    apiClient.post<ApiResponse<Word>>(API_ENDPOINTS.WORDS.ADD, data);

export const getAllWords = () =>
    apiClient.get<ApiResponse<{ public: Word[]; private: Word[] }>>(API_ENDPOINTS.WORDS.ALL);

export const getPrivateWords = () =>
    apiClient.get<ApiResponse<{ private: Word[] }>>(API_ENDPOINTS.WORDS.PRIVATE);

export const reviewWord = (id: string, data: { score: number; feedback: string }) =>
    apiClient.post<ApiResponse<Review>>(API_ENDPOINTS.WORDS.REVIEW(id), data);

export const getDailyWords = () =>
    apiClient.get<{ words: any[] }>('/words/daily');

export const getAllCategories = () => {
    // الحصول على User ID من الـ token
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    let userId = null;

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.userId || payload.id || payload.sub;
        } catch (error) {
            console.error('Error parsing token:', error);
        }
    }

    // إذا لم نتمكن من الحصول على User ID من الـ token، نستخدم null
    // وسيتم التعامل معه في الـ backend
    return apiClient.get<ApiResponse<{
        daily: { totalWords: number; words: any[]; learnedWords: any[]; unlearnedWords: any[] };
        known: { totalWords: number; words: any[]; publicWords: any[]; privateWords: any[] };
        partiallyKnown: { totalWords: number; words: any[]; publicWords: any[]; privateWords: any[] };
        unknown: { totalWords: number; words: any[]; publicWords: any[]; privateWords: any[] };
        private: { totalWords: number; words: any[]; publicWords: any[]; privateWords: any[] };
        summary: {
            dailyCount: number;
            knownCount: number;
            partiallyKnownCount: number;
            unknownCount: number;
            privateCount: number;
            totalCount: number;
        };
    }>>('/words/all-categories', { userId });
};

export const learnWord = (word: string) =>
    apiClient.post(API_ENDPOINTS.WORDS.LEARN(word));

export const getLearnedWords = () =>
    apiClient.get<{ words: any[] }>(API_ENDPOINTS.WORDS.LEARNED);

// --- DAILY STORIES ---
export const getDailyStory = () =>
    apiClient.get<ApiResponse<DailyStory>>(API_ENDPOINTS.DAILY_STORIES.GET);

// التحقق من وجود قصة لهذا اليوم
export const checkDailyStory = () =>
    apiClient.get<ApiResponse<{ hasStory: boolean; canGenerate: boolean }>>(API_ENDPOINTS.DAILY_STORIES.CHECK);

// طلب قصة جديدة
export const requestDailyStory = () =>
    apiClient.post<ApiResponse<DailyStory>>(API_ENDPOINTS.DAILY_STORIES.REQUEST, {});

// الحصول على إحصائيات الكلمات
export const getDailyStoryWordStatistics = () =>
    apiClient.get<ApiResponse<{
        totalWords: number;
        knownWords: number;
        partiallyKnownWords: number;
        unknownWords: number;
        progressPercentage: number;
    }>>(API_ENDPOINTS.DAILY_STORIES.WORD_STATISTICS);

// الحصول على الطلبات المتبقية
export const getDailyStoryRemaining = () =>
    apiClient.get<ApiResponse<{ remaining: number }>>(API_ENDPOINTS.DAILY_STORIES.REMAINING);

export const getAllDailyStoryWords = () =>
    apiClient.get<ApiResponse<{
        words: DailyStoryWord[];
        dailyWords: DailyStoryWord[];
        complementaryWords: DailyStoryWord[];
        knownWords: DailyStoryWord[];
        unknownWords: DailyStoryWord[];
        partiallyKnownWords: DailyStoryWord[];
        totalWords: number;
        dailyWordsCount: number;
        complementaryWordsCount: number;
        knownWordsCount: number;
        unknownWordsCount: number;
        partiallyKnownWordsCount: number;
    }>>(API_ENDPOINTS.DAILY_STORIES.GET_ALL_WORDS);

export const getComplementaryWords = () =>
    apiClient.get<ApiResponse<{ words: DailyStoryWord[] }>>(API_ENDPOINTS.DAILY_STORIES.GET_COMPLEMENTARY_WORDS);

export const getLearnedWordsFromStory = () =>
    apiClient.get<ApiResponse<{ words: DailyStoryWord[] }>>(API_ENDPOINTS.DAILY_STORIES.GET_LEARNED_WORDS);

export const getStoryWords = (storyId: string) =>
    apiClient.get<ApiResponse<{ words: DailyStoryWord[] }>>(API_ENDPOINTS.DAILY_STORIES.GET_STORY_WORDS(storyId));

export const updateWordStatus = (data: WordStatusUpdate) => {
    // Normalize frontend statuses to backend expectations
    // Frontend may use: 'NOT_LEARNED' | 'PARTIALLY_KNOWN' | 'KNOWN' | 'LEARNED'
    // Backend expects: 'NOT_LEARNED' | 'PARTIALLY_KNOWN' | 'KNOWN'
    const mapStatus = (status: WordStatusUpdate['status']): 'NOT_LEARNED' | 'PARTIALLY_KNOWN' | 'KNOWN' => {
        if (status === 'LEARNED') return 'KNOWN';
        return status as 'NOT_LEARNED' | 'PARTIALLY_KNOWN' | 'KNOWN';
    };

    const payload = {
        word: data.word,
        status: mapStatus(data.status),
    };

    return apiClient.post<ApiResponse>(API_ENDPOINTS.DAILY_STORIES.WORD_INTERACTION, payload);
};

export const completeDailyStory = (data: DailyStoryComplete) =>
    apiClient.post<ApiResponse<any>>(API_ENDPOINTS.DAILY_STORIES.COMPLETE, data);

export const canProceedToNextStep = () =>
    apiClient.get<ApiResponse<CanProceedResponse>>(API_ENDPOINTS.DAILY_STORIES.CAN_PROCEED);



// Exam related functions
export const submitDailyExam = (data: {
    storyId: string;
    answers: Record<string, string>;
    score: number;
    level: string;
    points: number
}) =>
    apiClient.post<ApiResponse<any>>(API_ENDPOINTS.DAILY_STORIES.COMPLETE, data);

// --- LESSONS (Trainer) ---
export const addLesson = (data: { title: string; content: string }) =>
    apiClient.post<ApiResponse<Lesson>>(API_ENDPOINTS.TRAINER.LESSONS.CREATE, data);

export const getLessons = () =>
    apiClient.get<ApiResponse<Lesson[]>>(API_ENDPOINTS.TRAINER.LESSONS.LIST);

export const updateLesson = (lessonId: string, data: any) =>
    apiClient.put<ApiResponse<Lesson>>(API_ENDPOINTS.TRAINER.LESSONS.UPDATE(lessonId), data);

export const deleteLesson = (lessonId: string) =>
    apiClient.delete<ApiResponse>(API_ENDPOINTS.TRAINER.LESSONS.DELETE(lessonId));

// --- STUDENTS (Trainer) ---
export const getStudents = () =>
    apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.TRAINER.STUDENTS.LIST);

export const getStudent = (studentId: string) =>
    apiClient.get<ApiResponse<any>>(API_ENDPOINTS.TRAINER.STUDENTS.GET(studentId));

// --- ADMIN ---
export const getAdminStats = () =>
    apiClient.get<ApiResponse<any>>(API_ENDPOINTS.ADMIN.STATS);

export const getAdminUsers = () =>
    apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.ADMIN.USERS.LIST);

export const changeUserRole = (userId: string, role: string) =>
    apiClient.put<ApiResponse>(API_ENDPOINTS.ADMIN.USERS.CHANGE_ROLE(userId), { role });

export const deleteUser = (userId: string) =>
    apiClient.delete<ApiResponse>(API_ENDPOINTS.ADMIN.USERS.DELETE(userId));

export const getAdminTrainers = () =>
    apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.ADMIN.TRAINERS.LIST);

// --- NOTIFICATIONS ---
export const getNotifications = () => {
    // الحصول على User ID من الـ token
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    let userId = null;

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.userId || payload.id || payload.sub;
        } catch (error) {
            console.error('Error parsing token:', error);
        }
    }

    return apiClient.get<ApiResponse<Notification[]>>(API_ENDPOINTS.NOTIFICATIONS.GET);
};

export const getUnreadNotificationsCount = () => {
    // الحصول على User ID من الـ token
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    let userId = null;

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.userId || payload.id || payload.sub;
        } catch (error) {
            console.error('Error parsing token:', error);
        }
    }

    return apiClient.get<ApiResponse<{ count: number }>>(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
};

export const getNotificationStats = () => {
    // الحصول على User ID من الـ token
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    let userId = null;

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.userId || payload.id || payload.sub;
        } catch (error) {
            console.error('Error parsing token:', error);
        }
    }

    return apiClient.get<ApiResponse<{
        total: number;
        unread: number;
        read: number;
        byType: Record<string, number>;
        recentActivity: any[];
    }>>(API_ENDPOINTS.NOTIFICATIONS.STATS);
};

export const markNotificationAsRead = (id: string) => {
    // الحصول على User ID من الـ token
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    let userId = null;

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.userId || payload.id || payload.sub;
        } catch (error) {
            console.error('Error parsing token:', error);
        }
    }

    return apiClient.put<ApiResponse>(API_ENDPOINTS.NOTIFICATIONS.MARK_AS_READ(id));
};

export const markAllNotificationsAsRead = () => {
    // الحصول على User ID من الـ token
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    let userId = null;

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.userId || payload.id || payload.sub;
        } catch (error) {
            console.error('Error parsing token:', error);
        }
    }

    return apiClient.put<ApiResponse>(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_AS_READ);
};

export const deleteNotification = (id: string) => {
    // الحصول على User ID من الـ token
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    let userId = null;

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.userId || payload.id || payload.sub;
        } catch (error) {
            console.error('Error parsing token:', error);
        }
    }

    return apiClient.delete<ApiResponse>(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
};

// --- CHAT ---
export const sendChatMessage = (data: { message: string; type: string; language: string; context?: string }) =>
    apiClient.post<ApiResponse<{ messageId: string; response: string; timestamp: string }>>(API_ENDPOINTS.CHAT.SEND, data);

export const getChatHistory = (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<{ messages: ChatMessage[]; total: number; page: number; limit: number }>>(API_ENDPOINTS.CHAT.HISTORY, params);

export const getChatRemainingRequests = () =>
    apiClient.get<ApiResponse<{ remaining: number }>>(API_ENDPOINTS.CHAT.REMAINING_REQUESTS);

// --- AI ---
export const generateStoryFromWords = (data: { words: string[]; level: string; language?: string }) =>
    apiClient.post<ApiResponse<{
        story: string;
        translation: string;
        highlighted_words: string[];
        level: string;
        language: string;
        isExisting: boolean;
    }>>(API_ENDPOINTS.AI.GENERATE_STORY_FROM_WORDS, data);

export const generateStory = (data: { words: string[]; level: string }) =>
    apiClient.post<ApiResponse<{ story: string; translation: string }>>(API_ENDPOINTS.AI.GENERATE_STORY_FROM_WORDS, data);

export const getAIRemainingRequests = () =>
    apiClient.get<ApiResponse<{ storyRequests: number; chatRequests: number }>>(API_ENDPOINTS.AI.REMAINING_REQUESTS);

// --- ACTIVITIES ---
export const addWordsLearned = (data: { count: number; period: string }) =>
    apiClient.post<ApiResponse<any>>(API_ENDPOINTS.ACTIVITIES.WORDS_LEARNED, data);

export const getWordsLearned = (period: string = 'month') =>
    apiClient.get<ApiResponse<{ count: number; period: string }>>(API_ENDPOINTS.ACTIVITIES.WORDS_LEARNED, { period });

export const addStreak = (data?: { action: string; date?: string }) => {
    const requestData = data || { action: 'add', date: new Date().toISOString().split('T')[0] };
    console.log("addStreak API call:", {
        endpoint: API_ENDPOINTS.ACTIVITIES.STREAK_ADD,
        data: requestData
    });
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.ACTIVITIES.STREAK_ADD, requestData);
};

// إضافة دوال جديدة للستريك
export const resetStreak = () => {
    console.log("resetStreak API call");
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.ACTIVITIES.STREAK_ADD, { action: 'reset' });
};

export const initializeStreak = () => {
    console.log("initializeStreak API call");
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.ACTIVITIES.STREAK_ADD, { action: 'initialize' });
};

export const getStreak = () =>
    apiClient.get<ApiResponse<{ streak: number; lastDate: string }>>(API_ENDPOINTS.ACTIVITIES.STREAK);

export const updateStreak = (data: { streak: number; lastDate: string }) =>
    apiClient.post<ApiResponse<any>>(API_ENDPOINTS.ACTIVITIES.STREAK_UPDATE, data);

export const logActivity = (data: any) =>
    apiClient.post<ApiResponse<any>>(API_ENDPOINTS.ACTIVITIES.LOG, data);

export const getActivityLog = () =>
    apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.ACTIVITIES.GET_LOG);

export const getProgress = () =>
    apiClient.get<ApiResponse<{ completedLessons: number; totalLessons: number; progressPercent: number }>>(API_ENDPOINTS.ACTIVITIES.PROGRESS);

export const addProgress = (data: { completedLessons: number; totalLessons: number; progressPercent: number }) =>
    apiClient.post<ApiResponse<any>>(API_ENDPOINTS.ACTIVITIES.PROGRESS, data);

// --- ACHIEVEMENTS ---
// Student Achievements
export const getMyAchievements = (params?: { userId?: string }) =>
    apiClient.get<ApiResponse<UserAchievementsResponse>>(API_ENDPOINTS.ACHIEVEMENTS.MY, params);

export const getMyAchievementProgress = (params?: { userId?: string }) =>
    apiClient.get<ApiResponse<AchievementProgress>>(API_ENDPOINTS.ACHIEVEMENTS.MY_PROGRESS, params);

export const getMyRecentAchievements = (params?: { userId?: string; limit?: number }) =>
    apiClient.get<ApiResponse<UserAchievement[]>>(API_ENDPOINTS.ACHIEVEMENTS.MY_RECENT, params);

export const getLeaderboard = (params?: { limit?: number }) =>
    apiClient.get<ApiResponse<LeaderboardEntry[]>>(API_ENDPOINTS.ACHIEVEMENTS.LEADERBOARD, params);

// Activity Registration
export const completeStory = (data: { userId: string; storyId: string; level: string; points: number }) =>
    apiClient.post<AchievementActivityResponse>(API_ENDPOINTS.ACHIEVEMENTS.COMPLETE_STORY, data);

export const completeDailyWords = (data: { userId: string; date: string; count: number }) =>
    apiClient.post<AchievementActivityResponse>(API_ENDPOINTS.ACHIEVEMENTS.COMPLETE_DAILY_WORDS, data);

export const addPrivateWordsAchievement = (data: { userId: string; count: number }) =>
    apiClient.post<AchievementActivityResponse>(API_ENDPOINTS.ACHIEVEMENTS.ADD_PRIVATE_WORDS, data);

export const learnWordsAchievement = (data: { userId: string; count: number; type: string }) =>
    apiClient.post<AchievementActivityResponse>(API_ENDPOINTS.ACHIEVEMENTS.LEARN_WORDS, data);

export const studyStreakAchievement = (data: { userId: string; streakDays: number }) =>
    apiClient.post<AchievementActivityResponse>(API_ENDPOINTS.ACHIEVEMENTS.STUDY_STREAK, data);

// Admin Management
export const getAllAchievements = () =>
    apiClient.get<ApiResponse<Achievement[]>>(API_ENDPOINTS.ACHIEVEMENTS.ALL);

export const getAchievementStats = () =>
    apiClient.get<ApiResponse<AchievementStats>>(API_ENDPOINTS.ACHIEVEMENTS.STATS);

export const addAchievement = (data: Partial<Achievement>) =>
    apiClient.post<ApiResponse<Achievement>>(API_ENDPOINTS.ACHIEVEMENTS.ADD, data);

export const updateAchievement = (id: string, data: Partial<Achievement>) =>
    apiClient.put<ApiResponse<Achievement>>(API_ENDPOINTS.ACHIEVEMENTS.UPDATE(id), data);

export const deleteAchievement = (id: string) =>
    apiClient.delete<ApiResponse>(API_ENDPOINTS.ACHIEVEMENTS.DELETE(id));

// Types and Management
export const getAchievementTypes = () =>
    apiClient.get<ApiResponse<AchievementType[]>>(API_ENDPOINTS.ACHIEVEMENTS.TYPES);

export const getUserAchievements = (userId: string) =>
    apiClient.get<ApiResponse<UserAchievement[]>>(API_ENDPOINTS.ACHIEVEMENTS.USER_ACHIEVEMENTS(userId));

export const resetUserAchievements = (userId: string) =>
    apiClient.post<ApiResponse>(API_ENDPOINTS.ACHIEVEMENTS.RESET_USER(userId), {});

// --- HEALTH CHECK ---
export const healthCheck = () =>
    apiClient.get<ApiResponse<{ status: string; timestamp: string }>>(API_ENDPOINTS.HEALTH.CHECK);

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