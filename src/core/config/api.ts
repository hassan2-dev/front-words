// API Configuration
export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
} as const;

// API Endpoints
export const ENDPOINTS = {
    // Auth
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        ME: '/auth/me',
    },

    // Words
    WORDS: {
        ADD: '/words', // POST
        LIST: '/words', // GET
        ALL: '/words/all', // GET
        GET: (id: string) => `/words/${id}`,
        UPDATE: (id: string) => `/words/${id}`,
        DELETE: (id: string) => `/words/${id}`,
        REVIEW: (id: string) => `/words/${id}/review`, // POST
    },

    // Stories
    STORIES: {
        LIST: '/stories', // GET مع فلترة
        GET: (id: string) => `/stories/${id}`,
        CREATE: '/stories', // POST
        UPDATE: (id: string) => `/stories/${id}`,
        DELETE: (id: string) => `/stories/${id}`,
    },

    // Lessons (Trainer)
    LESSONS: {
        LIST: '/trainer/lessons', // GET
        CREATE: '/trainer/lessons', // POST
        UPDATE: (lessonId: string) => `/trainer/lessons/${lessonId}`,
        DELETE: (lessonId: string) => `/trainer/lessons/${lessonId}`,
    },

    // Students (Trainer)
    STUDENTS: {
        LIST: '/trainer/students', // GET
        GET: (studentId: string) => `/trainer/students/${studentId}`,
    },

    // Notifications
    NOTIFICATIONS: {
        LIST: '/notifications', // GET
        CREATE: '/notifications', // POST
    },

    // Attendance
    ATTENDANCE: {
        LIST: '/attendance', // GET
        CREATE: '/attendance', // POST
    },

    // Chat
    CHAT: {
        SEND: '/chat/send', // POST
        HISTORY: '/chat/history', // GET
        REMAINING_REQUESTS: '/chat/remaining-requests', // GET
    },

    // AI
    AI: {
        GENERATE_STORY_FROM_WORDS: '/ai/generate/story-from-words', // POST
        REMAINING_REQUESTS: '/ai/remaining-requests', // GET
    },

    // Reviews
    REVIEWS: {
        LIST: '/reviews', // GET
    },

    // Achievements
    ACHIEVEMENTS: {
        // Student Achievements
        MY: '/achievements/my', // GET (جلب إنجازاتي)
        MY_PROGRESS: '/achievements/my/progress', // GET (جلب تقدمي في الإنجازات)
        MY_RECENT: '/achievements/my/recent', // GET (جلب إنجازاتي الحديثة)
        LEADERBOARD: '/achievements/my/leaderboard', // GET (جلب قائمة المتصدرين)

        // Activity Registration
        COMPLETE_STORY: '/achievements/complete-story', // POST
        COMPLETE_DAILY_WORDS: '/achievements/complete-daily-words', // POST
        ADD_PRIVATE_WORDS: '/achievements/add-private-words', // POST
        LEARN_WORDS: '/achievements/learn-words', // POST
        STUDY_STREAK: '/achievements/study-streak', // POST

        // Admin Management
        ALL: '/achievements/all', // GET (جلب جميع الإنجازات)
        STATS: '/achievements/stats', // GET (إحصائيات الإنجازات)
        ADD: '/achievements', // POST (إضافة إنجاز)
        UPDATE: (id: string) => `/achievements/${id}`, // PUT
        DELETE: (id: string) => `/achievements/${id}`, // DELETE

        // Types and Management
        TYPES: '/achievements/types', // GET (جلب أنواع الإنجازات)
        USER_ACHIEVEMENTS: (userId: string) => `/achievements/user/${userId}`, // GET (جلب إنجازات مستخدم)
        RESET_USER: (userId: string) => `/achievements/reset/${userId}`, // POST (إعادة تعيين إنجازات مستخدم)
    },
} as const;

// Request Headers
export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
} as const; 