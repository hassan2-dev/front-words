// User Types
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'TRAINER' | 'USER';
    avatar?: string;
    phone?: string;
    level?: number;
    streak?: number;
    totalWords?: number;
    createdAt: string;
    updatedAt: string;
}

// Auth Types
export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface LoginCredentials {
    phone: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
    achievements: never[];
    totalPoints: number;
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// Notification Types
export interface Notification {
    id: string;
    userId?: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

// Word Types
export interface Word {
    id: string;
    word: string;
    meaning: string;
    createdAt: string;
    isLearned?: boolean;
}

// Story Types
export interface Story {
    id: string;
    title: string;
    content: string;
    level: string;
    createdAt: string;
}

// Daily Story Types
export interface DailyStoryWord {
    sentence_ar: any;
    word: string;
    meaning: string;
    sentence: string;
    sentenceAr: string;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'black';
    status: 'UNKNOWN' | 'PARTIALLY_KNOWN' | 'KNOWN' | 'NOT_LEARNED';
    type: 'daily' | 'known' | 'partially_known' | 'unknown' | 'NOT_LEARNED';
    isDailyWord: boolean;
    canInteract?: boolean;
    isClickable?: boolean;
    hasDefinition?: boolean;
    hasSentence?: boolean;
}

export interface DailyStory {
    id: string;
    userId: string;
    title: string;
    content: string;
    translation: string;
    words: DailyStoryWord[];
    dailyWords?: DailyStoryWord[];
    complementaryWords?: DailyStoryWord[];
    knownWords?: DailyStoryWord[];
    unknownWords?: DailyStoryWord[];
    partiallyKnownWords?: DailyStoryWord[];
    totalWords?: number;
    dailyWordsCount?: number;
    complementaryWordsCount?: number;
    knownWordsCount?: number;
    unknownWordsCount?: number;
    partiallyKnownWordsCount?: number;
    date: string;
    isCompleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface WordStatusUpdate {
    word: string;
    status: 'UNKNOWN' | 'PARTIALLY_KNOWN' | 'KNOWN' | 'NOT_LEARNED';
}

export interface CanProceedResponse {
    canProceed: boolean;
    message: string;
    dailyWordsCompleted: number;
    totalDailyWords: number;
}

export interface DailyStoryComplete {
    storyId: string;
    level: string;
    points: number;
}

// Theme Types
export interface ThemeContextType {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

// Navigation Types
export interface NavItem {
    name: string;
    href: string;
    icon: React.ReactNode;
    badge?: number | null;
    roles?: string[];
}

// Trainer Types
export interface Trainer {
    id: string;
    name: string;
    phone: string;
    password?: string;
    students?: User[];
    lessons?: Lesson[];
    createdAt: string;
    updatedAt: string;
}

// Lesson Types
export interface Lesson {
    id: string;
    trainerId?: string;
    title: string;
    content: string;
    createdAt: string;
}

// Attendance Types
export interface Attendance {
    id: string;
    userId: string;
    attendedAt: string;
    note?: string;
    type: string;
    createdAt?: string;
}

// Review Types
export interface Review {
    id: string;
    userId: string;
    userName?: string;
    userLevel?: string;
    wordId: string;
    word?: string;
    meaning?: string;
    score: number;
    feedback: string;
    reviewedAt: string;
}

// Achievement Types
export interface Achievement {
    id: string;
    name: string;
    description: string;
    type: string;
    target: number;
    points: number;
    icon?: string;
    achieved?: boolean;
    date?: string;
    progress?: number;
}

// API Response for achievement activities
export interface AchievementActivityResponse {
    success: boolean;
    achievement?: string; // achievement code like "added_25_private_words"
    points: number;
}

// API Response for user achievements list
export interface UserAchievementsResponse {
    achievements: UserAchievement[];
    totalPoints: number;
}

export interface UserAchievement {
    id: string;
    userId: string;
    achievementId: string;
    achievement: Achievement;
    achievedAt: string;
    progress: number;
}

export interface AchievementProgress {
    totalAchievements: number;
    completedAchievements: number;
    totalPoints: number;
    currentStreak: number;
    level: string;
    nextLevelPoints: number;
}

export interface AchievementStats {
    totalUsers: number;
    totalAchievements: number;
    averagePoints: number;
    topAchievements: Achievement[];
    recentActivity: any[];
}

export interface LeaderboardEntry {
    userId: string;
    userName: string;
    totalPoints: number;
    rank: number;
    achievements: number;
}

export interface AchievementType {
    id: string;
    name: string;
    description: string;
    icon: string;
}

// Chat Message Types
export interface ChatMessage {
    id: string;
    userId: string;
    message: string;
    type: string;
    language: string;
    context?: string;
    createdAt: string;
}

// API Response Types (update for pagination)
export interface PaginatedResponse<T> {
    success: boolean;
    data: {
        [key: string]: T[] | any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
    message?: string;
    error?: string;
}

// Auth Response Types
export interface AuthResponse {
    access_token: string;
    user: User;
}

export interface RegisterResponse {
    success: boolean;
    user: User;
} 