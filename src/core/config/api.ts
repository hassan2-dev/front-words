// src/core/config/api.ts

const API_BASE_URL = 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  // ===== Authentication =====
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    UPDATE_PROFILE: '/auth/profile',
    CREATE_DEFAULT_USERS: '/auth/create-default-users',
  },

  // ===== Words =====
  WORDS: {
    ADD: '/words',
    LIST: '/words',
    ALL: '/words/all',
    GET: (id: string) => `/words/${id}`,
    UPDATE: (id: string) => `/words/${id}`,
    DELETE: (id: string) => `/words/${id}`,
    REVIEW: (id: string) => `/words/${id}/review`,
    LEARN: (word: string) => `/words/${word}/learn`,
    LEARNED: '/words/learned',
    PRIVATE: '/words/private',
    // New endpoints
    LEVEL: (level: string) => `/words/level/${level}`,
    SENTENCES: (level: string) => `/words/sentences/${level}`,
  },

  // ===== Daily Stories =====
  DAILY_STORIES: {
    // التحقق من وجود قصة
    CHECK: '/stories/daily/story/check',
    // طلب قصة جديدة
    REQUEST: '/stories/daily/story/request',
    // الحصول على القصة الحالية
    GET: '/stories',
    // الحصول على كل الكلمات
    GET_ALL_WORDS: '/stories/daily/story/all-words',
    GET_COMPLEMENTARY_WORDS: '/stories/daily/story/complementary-words',
    GET_LEARNED_WORDS: '/stories/daily/story/learned-words',
    GET_STORY_WORDS: (storyId: string) => `/stories/daily/story/${storyId}/words`,
    // الطلبات المتبقية
    REMAINING: '/stories/daily/story/remaining',
    // التفاعل مع الكلمات
    WORD_INTERACTION: '/stories/daily/story/word-interaction',
    // إحصائيات الكلمات
    WORD_STATISTICS: '/stories/daily/story/word-statistics',
    // إكمال القصة
    COMPLETE: '/stories/daily/story/complete',
    // التحقق من إمكانية المتابعة
    CAN_PROCEED: '/stories/daily/story/can-proceed',
  },

  // ===== AI =====
  AI: {
    GENERATE_STORY_FROM_WORDS: '/ai/generate/story-from-words',
    GENERATE_WORD_SENTENCES: '/ai/generate-word-sentences',
    GENERATE_MULTIPLE_WORD_SENTENCES: '/ai/generate-multiple-word-sentences',
    REMAINING_REQUESTS: '/ai/remaining-requests',
  },

  // ===== Trainer =====
  TRAINER: {
    STUDENTS: {
      LIST: '/trainer/students',
      GET: (studentId: string) => `/trainer/students/${studentId}`,
    },
    LESSONS: {
      LIST: '/trainer/lessons',
      CREATE: '/trainer/lessons',
      UPDATE: (lessonId: string) => `/trainer/lessons/${lessonId}`,
      DELETE: (lessonId: string) => `/trainer/lessons/${lessonId}`,
    },
  },

  // ===== Admin =====
  ADMIN: {
    STATS: '/admin/stats',
    USERS: {
      LIST: '/admin/users',
      CHANGE_ROLE: (userId: string) => `/admin/users/${userId}/role`,
      DELETE: (userId: string) => `/admin/users/${userId}`,
    },
    TRAINERS: {
      LIST: '/admin/trainers',
    },
  },

  // ===== Chat =====
  CHAT: {
    SEND: '/chat/send',
    HISTORY: '/chat/history',
    REMAINING_REQUESTS: '/chat/remaining-requests',
  },

  // ===== Notifications =====
  NOTIFICATIONS: {
    GET: '/notifications/my',
    UNREAD_COUNT: '/notifications/my/unread-count',
    STATS: '/notifications/my/stats',
    MARK_AS_READ: (notificationId: string) => `notifications/my/${notificationId}/read`,
    MARK_ALL_AS_READ: '/notifications/my/mark-all-as-read',
    DELETE: (notificationId: string) => `notifications/my/${notificationId}`,
  },

  // ===== Activities =====
  ACTIVITIES: {
    WORDS_LEARNED: '/activities/words-learned',
    STREAK: '/activities/streak',
    PROGRESS: '/activities/progress',
    ACHIEVEMENTS: {
      MY: '/activities/achievements/my',
      MY_PROGRESS: '/activities/achievements/my/progress',
    },
    STREAK_ADD: '/activities/streak/add',
    STREAK_UPDATE: '/activities/streak/update',
    LOG: '/activities/log',
    GET_LOG: '/activities/log',
  },

  // ===== Achievements =====
  ACHIEVEMENTS: {
    // Student Achievements
    MY: '/achievements/my',
    MY_PROGRESS: '/achievements/my/progress',
    MY_RECENT: '/achievements/my/recent',
    LEADERBOARD: '/achievements/my/leaderboard',

    // Activity Registration
    COMPLETE_STORY: '/achievements/complete-story',
    COMPLETE_DAILY_WORDS: '/achievements/complete-daily-words',
    ADD_PRIVATE_WORDS: '/achievements/add-private-words',
    LEARN_WORDS: '/achievements/learn-words',
    STUDY_STREAK: '/achievements/study-streak',

    // Admin Management
    ALL: '/achievements/all',
    STATS: '/achievements/stats',
    ADD: '/achievements',
    UPDATE: (id: string) => `/achievements/${id}`,
    DELETE: (id: string) => `/achievements/${id}`,
    TYPES: '/achievements/types',
    USER_ACHIEVEMENTS: (userId: string) => `/achievements/user/${userId}`,
    RESET_USER: (userId: string) => `/achievements/reset/${userId}`,
  },

  // ===== Health Check =====
  HEALTH: {
    CHECK: '/health',
  },
};

// Helper function to get full URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function for dynamic endpoints
export const getDynamicApiUrl = (endpoint: string, params: Record<string, string>): string => {
  let url = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });
  return getApiUrl(url);
};