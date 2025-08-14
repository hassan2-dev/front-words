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
    UNKNOWN: '/words/unknown',
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
    GET_ALL_STORIES: '/stories/daily/story/all-stories',
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
    // Dashboard & Overview
    DASHBOARD: {
      OVERVIEW: '/trainer/dashboard/overview',
      STUDENTS_STATS: '/trainer/dashboard/students-stats',
      STORIES_STATS: '/trainer/dashboard/stories-stats',
    },

    // Students Management
    STUDENTS: {
      LIST: '/trainer/students',
      GET: (studentId: string) => `/trainer/students/${studentId}`,
      UPDATE: (studentId: string) => `/trainer/students/${studentId}`,
      CREATE: '/trainer/students',
      DELETE: (studentId: string) => `/trainer/students/${studentId}`,
    },

    // Lessons Management
    LESSONS: {
      LIST: '/trainer/lessons',
      CREATE: '/trainer/lessons',
      GET: (lessonId: string) => `/trainer/lessons/${lessonId}`,
      UPDATE: (lessonId: string) => `/trainer/lessons/${lessonId}`,
      DELETE: (lessonId: string) => `/trainer/lessons/${lessonId}`,
    },

    // Student Activities
    ACTIVITIES: {
      STUDENT_DAILY: (studentId: string, date: string) => `/trainer/activities/student/${studentId}/daily/${date}`,
      STUDENT_WEEKLY: (studentId: string, date: string) => `/trainer/activities/student/${studentId}/weekly/${date}`,
      STUDENT_MONTHLY: (studentId: string, date: string) => `/trainer/activities/student/${studentId}/monthly/${date}`,
      STUDENT_STATS: (studentId: string) => `/trainer/activities/student/${studentId}/stats`,
      LIST: '/trainer/activities',
      FILTER: '/trainer/activities/filter',
    },

    // Stories Management
    STORIES: {
      LIST: '/trainer/stories',
      GET: (storyId: string) => `/trainer/stories/${storyId}`,
      CREATE: '/trainer/stories',
      UPDATE: (storyId: string) => `/trainer/stories/${storyId}`,
      DELETE: (storyId: string) => `/trainer/stories/${storyId}`,
      STUDENT_STORIES: (studentId: string) => `/trainer/stories/student/${studentId}`,
    },

    // Notifications
    NOTIFICATIONS: {
      LIST: '/trainer/notifications',
      GET: (notificationId: string) => `/trainer/notifications/${notificationId}`,
      UPDATE: (notificationId: string) => `/trainer/notifications/${notificationId}`,
      SEND: '/trainer/notifications/send',
    },
  },

  // ===== Admin =====
  ADMIN: {
    // Dashboard & Overview
    DASHBOARD: '/admin/dashboard',
    OVERVIEW: '/admin/overview',
    STATS: '/admin/stats',

    // Users Management
    USERS: {
      LIST: '/admin/users',
      ALL: '/admin/users/all',
      TRAINERS: '/admin/users/trainers',
      STUDENTS: '/admin/users/students',
      GET: (userId: string) => `/admin/users/${userId}`,
      CREATE: '/admin/users',
      UPDATE: (userId: string) => `/admin/users/${userId}`,
      CHANGE_ROLE: (userId: string) => `/admin/users/${userId}/role`,
      DELETE: (userId: string) => `/admin/users/${userId}`,
      BULK_ACTIONS: '/admin/users/bulk-actions',
      // User Status Management
      TOGGLE_STATUS: (userId: string) => `/admin/users/${userId}/toggle-status`,
      ACTIVATE: (userId: string) => `/admin/users/${userId}/activate`,
      DEACTIVATE: (userId: string) => `/admin/users/${userId}/deactivate`,
      BULK_TOGGLE_STATUS: '/admin/users/bulk-toggle-status',
    },

    // Content Management
    CONTENT: {
      WORDS: {
        LIST: '/admin/content/words',
        CREATE: '/admin/content/words',
        GET: (wordId: string) => `/admin/content/words/${wordId}`,
        UPDATE: (wordId: string) => `/admin/content/words/${wordId}`,
        DELETE: (wordId: string) => `/admin/content/words/${wordId}`,
        BULK_ACTIONS: '/admin/content/words/bulk-actions',
      },
      STORIES: {
        LIST: '/admin/content/stories',
        CREATE: '/admin/content/stories',
        GET: (storyId: string) => `/admin/content/stories/${storyId}`,
        UPDATE: (storyId: string) => `/admin/content/stories/${storyId}`,
        DELETE: (storyId: string) => `/admin/content/stories/${storyId}`,
        BULK_ACTIONS: '/admin/content/stories/bulk-actions',
      },
      LESSONS: {
        LIST: '/admin/content/lessons',
        CREATE: '/admin/content/lessons',
        GET: (lessonId: string) => `/admin/content/lessons/${lessonId}`,
        UPDATE: (lessonId: string) => `/admin/content/lessons/${lessonId}`,
        DELETE: (lessonId: string) => `/admin/content/lessons/${lessonId}`,
        BULK_ACTIONS: '/admin/content/lessons/bulk-actions',
      },
    },

    // Analytics
    ANALYTICS: {
      OVERVIEW: '/admin/analytics/overview',
      USERS: '/admin/analytics/users',
      CONTENT: '/admin/analytics/content',
      ENGAGEMENT: '/admin/analytics/engagement',
      PERFORMANCE: '/admin/analytics/performance',
      EXPORT: '/admin/analytics/export',
    },

    // Settings
    SETTINGS: {
      GET: '/admin/settings',
      UPDATE: '/admin/settings',
      FEATURES: {
        GET: '/admin/settings/features',
        UPDATE: '/admin/settings/features',
      },
      SYSTEM: {
        GET: '/admin/settings/system',
        UPDATE: '/admin/settings/system',
      },
      SECURITY: {
        GET: '/admin/settings/security',
        UPDATE: '/admin/settings/security',
      },
    },

    // Achievements Management
    ACHIEVEMENTS: {
      LIST: '/admin/achievements',
      CREATE: '/admin/achievements',
      GET: (achievementId: string) => `/admin/achievements/${achievementId}`,
      UPDATE: (achievementId: string) => `/admin/achievements/${achievementId}`,
      DELETE: (achievementId: string) => `/admin/achievements/${achievementId}`,
      STATS: '/admin/achievements/stats',
      TYPES: '/admin/achievements/types',
      USER_ACHIEVEMENTS: (userId: string) => `/admin/achievements/user/${userId}`,
      RESET_USER: (userId: string) => `/admin/achievements/reset/${userId}`,
    },

    // Legacy endpoints (for backward compatibility)
    TRAINERS: {
      LIST: '/admin/trainers',
      GET: (trainerId: string) => `/admin/trainers/${trainerId}`,
      CREATE: '/admin/trainers',
      UPDATE: (trainerId: string) => `/admin/trainers/${trainerId}`,
      DELETE: (trainerId: string) => `/admin/trainers/${trainerId}`,
      TOGGLE_STATUS: (trainerId: string) => `/admin/trainers/${trainerId}/toggle-status`,
      ACTIVATE: (trainerId: string) => `/admin/trainers/${trainerId}/activate`,
      DEACTIVATE: (trainerId: string) => `/admin/trainers/${trainerId}/deactivate`,
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