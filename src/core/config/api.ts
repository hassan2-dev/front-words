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
    GET: '/stories/daily/story',
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
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_AS_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/mark-all-read',
    DELETE: (id: string) => `/notifications/${id}`,
    STATS: '/notifications/stats',
    SEND: '/notifications/send',

    // Student Notifications
    WELCOME_STUDENT: '/notifications/welcome-student',
    DAILY_LOGIN_REMINDER: '/notifications/daily-login-reminder',
    STORY_COMPLETED: '/notifications/story-completed',
    WORD_LEARNED: '/notifications/word-learned',
    LEVEL_UP: '/notifications/level-up',
    ACHIEVEMENT_UNLOCKED: '/notifications/achievement-unlocked',
    DAILY_GOAL: '/notifications/daily-goal',
    DAILY_WORDS_GOAL_COMPLETED: '/notifications/daily-words-goal-completed',
    ALL_DAILY_WORDS_COMPLETED: '/notifications/all-daily-words-completed',
    WEEKLY_REPORT: '/notifications/weekly-report',
    DAILY_REMINDER: '/notifications/daily-reminder',
    NEW_DAILY_STORY: '/notifications/new-daily-story',
    LEVEL_CHANGED: '/notifications/level-changed',
    CONGRATULATIONS: '/notifications/congratulations',
    DAILY_WORDS_COMPLETED: '/notifications/daily-words-completed',
    NEW_LEARNING_DAY: '/notifications/new-learning-day',
    WEEKLY_GOAL_ACHIEVED: '/notifications/weekly-goal-achieved',
    COMPETITION_REMINDER: '/notifications/competition-reminder',
    NEW_LESSON: '/notifications/new-lesson',
    PRONUNCIATION_REVIEW: '/notifications/pronunciation-review',

    // Trainer Notifications
    TRAINER_NEW_STUDENT: '/notifications/trainer/new-student',
    TRAINER_STUDENT_COMPLETED_STORY: '/notifications/trainer/student-completed-story',
    TRAINER_STUDENT_COMPLETED_DAILY_WORDS: '/notifications/trainer/student-completed-daily-words',
    TRAINER_STUDENT_COMPLETED_LESSON: '/notifications/trainer/student-completed-lesson',
    TRAINER_STUDENT_LEVEL_UP: '/notifications/trainer/student-level-up',

    // Admin Notifications
    ADMIN_HUNDRED_REQUESTS: '/notifications/admin/hundred-requests',
    ADMIN_API_KEY_EXPIRED: '/notifications/admin/api-key-expired',
    ADMIN_REQUEST_MILESTONE: '/notifications/admin/request-milestone',
    ADMIN_NEW_TRAINER: '/notifications/admin/new-trainer',
    ADMIN_NEW_STORY: '/notifications/admin/new-story',
    ADMIN_NEW_WORD: '/notifications/admin/new-word',

    // General Notifications
    COMPETITION_JOINED: '/notifications/competition-joined',
    COMPETITION_RESULT: '/notifications/competition-result',
    STREAK_MILESTONE: '/notifications/streak-milestone',

    // Bulk Notifications
    SEND_DAILY_REMINDERS_TO_ALL: '/notifications/send-daily-reminders-to-all',
    SEND_NEW_DAY_NOTIFICATIONS_TO_ALL: '/notifications/send-new-day-notifications-to-all',
    SEND_CONGRATULATIONS_FOR_MILESTONE: '/notifications/send-congratulations-for-milestone',
    DAILY_WORDS_COMPLETION: '/notifications/daily-words-completion',
    LEVEL_UP_WITH_CONGRATULATIONS: '/notifications/level-up-with-congratulations',
    NOTIFY_NEW_LESSON_TO_LEVEL: '/notifications/notify-new-lesson-to-level',
    NOTIFY_COMPETITION_REMINDER_TO_PARTICIPANTS: '/notifications/notify-competition-reminder-to-participants',
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