// Application Constants
export const APP_NAME = 'Let <span className="text-orange-600">s</span>peak' as const;
export const APP_VERSION = '1.0.0' as const;
export const APP_DESCRIPTION = 'منصة تعلم اللغة الإنجليزية التفاعلية' as const;

// User Roles
export const USER_ROLES = {
    ADMIN: 'ADMIN',
    TRAINER: 'TRAINER',
    USER: 'USER',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'letspeak_auth_token',
    REFRESH_TOKEN: 'letspeak_refresh_token',
    USER_DATA: 'letspeak_user_data',
    THEME: 'letspeak_theme',
    LANGUAGE: 'letspeak_language',
} as const;

// Theme Constants
export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
} as const;

// Word Difficulty Levels
export const WORD_DIFFICULTY = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
} as const;

// Story Difficulty Levels
export const STORY_DIFFICULTY = {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    ACHIEVEMENT: 'achievement',
    COMPETITION: 'competition',
    SYSTEM: 'system',
} as const;

// Navigation Paths
export const ROUTES = {
    // Public
    HOME: '/',
    AUTH: '/auth',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',

    // User
    DASHBOARD: '/dashboard',
    DAILY_WORDS: '/daily-words',
    CHAT_WITH_AI: '/chat-with-ai',
    STORIES: '/stories',
    NOTIFICATIONS: '/notifications',
    PROFILE: '/profile',
    SETTINGS: '/settings',

    // Admin
    ADMIN: '/admin',
    ADMIN_DASHBOARD: '/admin/dashboard',
    ADMIN_USERS: '/admin/users',
    ADMIN_ANALYTICS: '/admin/analytics',

    // Trainer
    TRAINER: '/trainer',
    TRAINER_DASHBOARD: '/trainer/dashboard',
    TRAINER_STUDENTS: '/trainer/students',
    TRAINER_CONTENT: '/trainer/content',
} as const;

// Animation Durations (in milliseconds)
export const ANIMATION_DURATION = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
} as const;

// Breakpoints (Tailwind CSS)
export const BREAKPOINTS = {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px',
} as const; 