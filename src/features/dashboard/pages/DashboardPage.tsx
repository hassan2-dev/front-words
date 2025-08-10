import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../../core/providers/AuthProvider";
import {
  getProgress,
  getStreak,
  addStreak,
  resetStreak,
  initializeStreak,
  getLearnedWords,
  getDailyStory,
  requestDailyStory,
} from "@/core/utils/api";
import { Loading } from "@/presentation/components";
import {
  FaBookOpen,
  FaFire,
  FaStar,
  FaChartLine,
  FaMoon,
  FaSun,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import type { DailyStory } from "@/core/types";
import { DailyStoryExam } from "../../daily-words/components/DailyStoryExam";

// Enhanced CSS animations and utility classes (UI-only)
const enhancedAnimations = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes slideIn {
    from { transform: translateX(-30px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes bounceIn {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.05); opacity: 0.8; }
    70% { transform: scale(0.9); opacity: 0.9; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
  .animate-slideIn { animation: slideIn 0.5s ease-out; }
  .animate-bounceIn { animation: bounceIn 0.8s ease-out; }
  .animate-pulse-custom { animation: pulse 2s infinite; }
  .animate-float { animation: float 3s ease-in-out infinite; }
  .shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
    background-size: 200px 100%;
    animation: shimmer 1.5s infinite;
  }
  .glass {
    backdrop-filter: blur(16px);
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .dark .glass {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

// Types
interface Progress {
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
}

interface StreakData {
  streak: number;
  lastDate?: string;
  streakDays?: string[];
}

// Components

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12 sm:py-20">
    <Loading
      size="lg"
      variant="video"
      text="جاري تحميل بياناتك الشخصية..."
      className="mb-0"
      isOverlay
    />
  </div>
);

const ErrorDisplay: React.FC<{ error: string; onRetry: () => void }> = ({
  error,
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4 sm:mb-6">
      <span className="text-red-600 text-2xl sm:text-3xl">⚠️</span>
    </div>
    <div className="text-center text-red-600 dark:text-red-400 mb-4 sm:mb-6 text-lg font-medium">
      {error}
    </div>
    <button
      onClick={onRetry}
      className="px-6 sm:px-8 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-sm sm:text-base"
    >
      🔄 إعادة المحاولة
    </button>
  </div>
);

// UI-only: Dark mode toggle button
const DarkModeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const dailyStoryCompleted = localStorage.getItem("dailyStoryCompleted");
  return (
    <button
      onClick={() => setIsDark((v) => !v)}
      className="fixed top-4 right-4 z-50 p-3 rounded-full glass hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 group shadow-lg hover:shadow-xl"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <FaSun className="w-5 h-5 text-yellow-500 group-hover:text-yellow-400 transition-colors duration-300" />
      ) : (
        <FaMoon className="w-5 h-5 text-blue-600 group-hover:text-blue-500 transition-colors duration-300" />
      )}
    </button>
  );
};

const WeeklyStreakDisplay: React.FC<{ streakDates: string[] }> = ({
  streakDates,
}) => {
  console.log("WeeklyStreakDisplay render:", { streakDates });
  const weekDayNames = [
    "السبت",
    "الأحد",
    "الإثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
  ];

  const today = new Date();
  const todayStr =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");

  // Get the current week (Saturday to Friday)
  const currentWeekStart = new Date(today);
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  const daysFromSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1; // Convert to Saturday-based
  currentWeekStart.setDate(today.getDate() - daysFromSaturday); // Start from Saturday

  // Build the current week days
  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);
    weekDays.push(d);
  }
  console.log(
    "Current week days:",
    weekDays.map((d) => d.toISOString().split("T")[0])
  );

  // Helper functions
  const isStreakDay = (date: Date) => {
    const dateStr =
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0");
    return sortedStreakDates.includes(dateStr);
  };

  const isToday = (date: Date) => {
    const dateStr =
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0");
    return dateStr === todayStr;
  };

  const isPast = (date: Date) => {
    const dateStr =
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0");
    return dateStr < todayStr;
  };

  // If no streaks at all
  if (!streakDates.length) {
    console.log("No streak dates found, showing empty state");
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <span className="text-gray-400 text-sm mb-2">
          لا يوجد سلسلة أيام بعد
        </span>
        <span className="text-orange-400 text-2xl">🔥</span>
        <span className="text-xs text-gray-400 mt-2">
          ابدأ اليوم وحقق أول سلسلة!
        </span>
      </div>
    );
  }

  // Sort streak dates to ensure they're in chronological order
  const sortedStreakDates = [...streakDates].sort();
  console.log("WeeklyStreakDisplay sorted dates:", {
    sortedStreakDates,
    weekDays: weekDays.map((d) => d.toISOString().split("T")[0]),
  });

  return (
    <div className="w-full max-w-xl mx-auto">
      {(() => {
        console.log("Rendering streak calendar with dates:", streakDates);
        return null;
      })()}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2 mb-2">
        أسبوعك الحالي
      </div>
      <div className="flex justify-center gap-1 sm:gap-2">
        {weekDays.map((d) => {
          const dateStr =
            d.getFullYear() +
            "-" +
            String(d.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(d.getDate()).padStart(2, "0");
          const isStreak = isStreakDay(d);
          const todayHighlight = isToday(d);
          const isPastDay = isPast(d);

          console.log("Day check:", {
            dateStr,
            isStreak,
            todayHighlight,
            isPastDay,
          });

          return (
            <div
              key={dateStr}
              className={`relative flex flex-col items-center w-12 sm:w-16 md:w-20 p-1 sm:p-2 rounded-xl transition-all border-2 shadow-md
                ${
                  isStreak
                    ? "bg-gradient-to-br from-orange-400 to-yellow-400 text-white border-orange-500 scale-105 hover:scale-110"
                    : isPastDay
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400"
                }
                ${todayHighlight ? "ring-2 ring-blue-400 ring-offset-2" : ""}
              `}
              style={{ minWidth: 48, cursor: isStreak ? "pointer" : "default" }}
              title={
                isStreak
                  ? "لديك سلسلة في هذا اليوم!"
                  : isPastDay
                  ? "لم تدخل في هذا اليوم"
                  : "يوم مستقبلي"
              }
            >
              <span className="text-xs sm:text-sm font-bold mb-1 text-gray-500 dark:text-gray-400">
                {weekDayNames[d.getDay()]}
              </span>
              <span className="text-base sm:text-lg font-bold mb-1">
                {d.getDate()}
              </span>
              {isStreak && <span className="text-lg animate-bounce">🔥</span>}
              {todayHighlight && !isStreak && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              )}
              {isPastDay && !isStreak && (
                <span className="text-xs text-gray-400 mt-1">✗</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-center mt-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 bg-orange-400 rounded-full"></span>
          أيام دخول
        </span>
        <span className="mx-2">•</span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
          أيام فائتة
        </span>
        <span className="mx-2">•</span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
          اليوم الحالي
        </span>
      </div>
    </div>
  );
};

/*
 * التحديثات المضافة:
 *
 * 1. إضافة دالة checkAndLoadDailyStory() للتحقق من وجود القصة اليومية قبل التوجيه
 * 2. إضافة دالة createFallbackStory() لإنشاء قصة احتياطية عند عدم وجود قصة
 * 3. إضافة loading modal للقصة مع رسائل تقدم مختلفة
 * 4. تعديل handleAddStreak() لتوجيه المستخدم للقصة فقط عند إضافة الستريك لأول مرة
 * 5. إزالة التوجيه التلقائي للقصة من useEffect
 * 6. إضافة localStorage للتحقق من عرض القصة في نفس اليوم
 * 7. إضافة timeout لمنع infinite loop (30 ثانية للقصة - محسن للإندبوينت الجديد)
 * 8. منع المحاولات المتكررة للقصة والستريك
 * 9. إضافة handleAddStreakAndCreateStory() لطلب قصة جديدة مباشرة
 *
 * الإندبوينت الجديد: POST /api/stories/daily/story/request
 * - يدعم Rate Limiting (قصة واحدة يومياً)
 * - يدعم AI Story Generation (15-25 ثانية)
 * - يدعم Fallback Stories (0.5 ثانية)
 * - التكلفة: 0.004-0.006$ للقصة الجديدة
 *
 * الرسائل المتوقعة:
 * - "جاري التحقق من القصة اليومية..."
 * - "جاري طلب القصة اليومية..."
 * - "جاري إنشاء قصة احتياطية..."
 * - "تم إنشاء القصة بنجاح!"
 * - "تم إنشاء قصة احتياطية!"
 *
 * رسائل الخطأ:
 * - "انتهت مهلة طلب القصة. يرجى المحاولة مرة أخرى."
 * - "حدث خطأ في طلب القصة. يرجى المحاولة مرة أخرى."
 * - "لقد استخدمت حد القصة اليومي. يمكنك طلب قصة جديدة غداً."
 */

const StatCard: React.FC<{
  title: string;
  subtitle: string;
  value: string | number;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  hoverBorder: string;
  children?: React.ReactNode;
}> = ({
  title,
  subtitle,
  value,
  icon,
  gradientFrom,
  gradientTo,
  hoverBorder,
  children,
}) => (
  <div
    className={`group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 ${hoverBorder}`}
  >
    <div
      className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} group-hover:from-opacity-20 group-hover:to-opacity-20 transition-all duration-500`}
    ></div>
    <div className="relative p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 truncate">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            {subtitle}
          </p>
        </div>
        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-current to-current rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-3">
          {icon}
        </div>
      </div>

      <div className="text-center">
        <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white block mb-2">
          {value}
        </span>
      </div>

      {children}
    </div>
  </div>
);

const ActionButton: React.FC<{
  title: string;
  description: string;
  icon: string;
  gradientFrom: string;
  gradientTo: string;
  hoverBorder: string;
  onClick?: () => void;
}> = ({
  title,
  description,
  icon,
  gradientFrom,
  gradientTo,
  hoverBorder,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`group relative overflow-hidden bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-700 ${hoverBorder} transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 w-full`}
  >
    <div
      className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} group-hover:from-opacity-20 group-hover:to-opacity-20 transition-all duration-500`}
    ></div>
    <div className="relative text-center">
      <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto mb-3 sm:mb-4 lg:mb-6 bg-gradient-to-br from-current to-current rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
        <span className="text-xl sm:text-2xl">{icon}</span>
      </div>
      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
        {description}
      </p>
    </div>
  </button>
);

// Add modal component
const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-2 animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-2 left-2 text-gray-400 hover:text-red-500 text-xl font-bold focus:outline-none"
          aria-label="إغلاق"
        >
          ×
        </button>
        {children}
      </div>
      <div className="fixed inset-0 z-40" onClick={onClose} />
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  console.log("Dashboard Auth State:", {
    user: user
      ? {
          name: user.name,
          role: user.role || "USER", // Default to USER if role is undefined
          id: user.id,
          fullUser: user,
        }
      : null,
    isAuthenticated,
    authLoading,
  });

  // State
  const [progress, setProgress] = useState<Progress | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [wordsCount, setWordsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingStreak, setAddingStreak] = useState(false);
  const [lastStreakDate, setLastStreakDate] = useState<string | null>(null);
  const [streakDates, setStreakDates] = useState<string[]>([]);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streakAddedToday, setStreakAddedToday] = useState(false);
  const [dailyStory, setDailyStory] = useState<DailyStory | null>(null);
  const [showDailyStory, setShowDailyStory] = useState(false);
  const [showDailyStoryExam, setShowDailyStoryExam] = useState(false);
  const [dailyStoryCompleted, setDailyStoryCompleted] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isProcessingStreak, setIsProcessingStreak] = useState(false);

  // New states for story loading
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [storyLoadingError, setStoryLoadingError] = useState<string | null>(
    null
  );

  // New states for streak error handling
  const [streakError, setStreakError] = useState<string | null>(null);
  const [showStreakError, setShowStreakError] = useState(false);

  // New states for welcome modal
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // دالة مساعدة لتحويل التاريخ من UTC إلى المحلي
  const convertUTCToLocalDate = (utcDateString: string): string => {
    const utcDate = new Date(utcDateString);
    const localDate = new Date(
      utcDate.getTime() + utcDate.getTimezoneOffset() * 60000
    );
    return localDate.toISOString().split("T")[0];
  };

  // دالة لمسح localStorage
  const clearLocalStorage = () => {
    localStorage.removeItem("lastStreakAddedDate");
    localStorage.removeItem("lastStoryShownDate");
    localStorage.removeItem("lastDailyStoryDate");
    localStorage.removeItem("welcomeShown");
    localStorage.removeItem("lastWelcomeShownDate");
    console.log("LocalStorage cleared successfully");

    // إعادة تعيين الحالة
    setStreakAddedToday(false);
    setDailyStoryCompleted(false);
    setShowWelcomeModal(false);
    setIsNewUser(false);

    // إعادة تحميل البيانات
    fetchDashboardData();
  };

  // استخدام useRef لتتبع تشغيل useEffect
  const welcomeModalChecked = useRef(false);
  const storyLoadingRef = useRef(false);

  // دالة للتحقق من وجود ستريك
  const hasStreak = (): boolean => {
    const result = streak > 0 || streakAddedToday;
    console.log("🔍 hasStreak check:", {
      streak,
      streakAddedToday,
      result,
    });
    return result;
  };

  // دالة للتحقق من الستريك في قاعدة البيانات
  const verifyStreakInDatabase = async (): Promise<boolean> => {
    try {
      console.log("🔍 Verifying streak in database...");
      const streakResponse = await getStreak();
      console.log("📊 Full streak response:", streakResponse);

      if (streakResponse.success && streakResponse.data) {
        const data = streakResponse.data as any;
        console.log("📊 Streak data structure:", data);

        // Check multiple possible field names for streak count
        const currentStreak =
          data.currentStreak || data.streak || data.streakCount || 0;
        console.log("📊 Current streak in database:", currentStreak);

        const hasValidStreak = currentStreak > 0;
        console.log(
          hasValidStreak
            ? "✅ Streak verified successfully"
            : "❌ No valid streak found"
        );
        return hasValidStreak;
      }
      console.log("❌ No streak data found in response");
      return false;
    } catch (error) {
      console.error("❌ Error verifying streak in database:", error);
      return false;
    }
  };

  // Functions
  const fetchDailyStory = async () => {
    try {
      const response = await getDailyStory();
      if (response.success && response.data) {
        setDailyStory(response.data as unknown as DailyStory);
      }
    } catch (error) {
      console.error("Error fetching daily story:", error);
    }
  };

  // New function to check if story exists and handle loading
  const checkAndLoadDailyStory = async () => {
    console.log("=== checkAndLoadDailyStory called ===");

    // بداية قياس الوقت
    const startTime = performance.now();
    console.log("⏱️ Starting story loading timer...");

    // منع الاستدعاءات المتكررة
    if (storyLoadingRef.current) {
      console.log("⏳ Story loading already in progress, skipping...");
      return;
    }

    storyLoadingRef.current = true;

    // التحقق من وجود ستريك في قاعدة البيانات مباشرة
    console.log("🔍 Verifying streak in database...");
    const streakVerified = await verifyStreakInDatabase();
    console.log("📊 Streak verification result:", streakVerified);

    if (!streakVerified) {
      console.log("❌ Streak not verified in database, retrying...");
      // انتظار إضافي وإعادة المحاولة
      await new Promise((resolve) => setTimeout(resolve, 500)); // تقليل الوقت إلى 500ms
      const retryVerification = await verifyStreakInDatabase();
      console.log("📊 Retry verification result:", retryVerification);

      if (!retryVerification) {
        console.log("❌ Streak still not verified, showing welcome modal");
        setShowWelcomeModal(true);
        return;
      }
    }

    console.log(
      "✅ Streak verified in database, proceeding with daily story check..."
    );
    const now = new Date();
    const today =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");

    const lastStoryDate = localStorage.getItem("lastStoryShownDate");

    console.log("📊 Story check conditions:", {
      today,
      lastStoryDate,
      isSameDay: lastStoryDate === today,
      shouldSkip: lastStoryDate === today,
      hasStreak: streak > 0 || streakAddedToday,
    });

    // إذا تم عرض القصة اليوم، لا نحتاج لتحميلها مرة أخرى
    if (lastStoryDate === today) {
      console.log("📝 Story already shown today, skipping...");
      setDailyStoryCompleted(true);
      return;
    }

    // منع المحاولات المتكررة
    if (isLoadingStory) {
      console.log("⏳ Story is already being loaded, skipping...");
      return;
    }

    console.log("🚀 About to start loading story...");

    console.log("📝 Setting isLoadingStory to true");
    setIsLoadingStory(true);
    setStoryLoadingError(null);
    setLoadingMessage("جاري التحقق من القصة...");
    console.log("📝 Setting loading message: جاري التحقق من القصة...");

    // تأخير قصير
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // محاولة الحصول على القصة من الإندبوينت الجديد مع timeout محسن
      let response;
      try {
        // إضافة رسائل تحميل تفصيلية مع توقيتات واقعية (90-120 ثانية)
        const loadingSteps = [
          { message: "جاري التحقق من القصة اليومية...", duration: 2000 },
          { message: "جاري البحث في قاعدة البيانات...", duration: 2000 },
          { message: "جاري جلب بيانات المستخدم...", duration: 2000 },
          { message: "جاري توليد الكلمات اليومية...", duration: 3000 },
          { message: "جاري اختيار الكلمات المناسبة...", duration: 3000 },
          {
            message: "جاري توليد القصة بالذكاء الاصطناعي (150 كلمة)...",
            duration: 35000,
          },
          { message: "جاري ترجمة القصة...", duration: 25000 },
          { message: "جاري إثراء الكلمات (150 كلمة)...", duration: 45000 },
          { message: "جاري حفظ القصة...", duration: 3000 },
          { message: "جاري إعداد القصة للعرض...", duration: 2000 },
        ];

        let currentStep = 0;
        let totalTime = 0;

        const messageInterval = setInterval(() => {
          if (currentStep < loadingSteps.length) {
            const step = loadingSteps[currentStep];
            setLoadingMessage(step.message);
            totalTime += step.duration;
            currentStep++;
          }
        }, 3000); // تحديث كل 3 ثانية ليتناسب مع الوقت الأطول

        const apiStartTime = performance.now();
        response = (await Promise.race([
          requestDailyStory(),
          new Promise(
            (_, reject) =>
              setTimeout(() => reject(new Error("StoryRequestTimeout")), 150000) // 150 ثانية للطلب (90-120 ثانية + buffer)
          ),
        ])) as any;
        const apiEndTime = performance.now();
        const apiDuration = apiEndTime - apiStartTime;

        clearInterval(messageInterval);
      } catch (apiError) {
        console.log(
          "❌ Story request failed, creating fallback story:",
          apiError
        );
        // إذا فشل الـ API، ننتقل لإنشاء قصة احتياطية
        await createFallbackStory();
        return;
      }

      if (response.success && response.data) {
        setLoadingMessage("جاري تحميل القصة...");

        // تأخير قصير لمحاكاة التحميل
        await new Promise((resolve) => setTimeout(resolve, 150));

        setDailyStory(response.data as unknown as DailyStory);
        setLoadingMessage("تم إنشاء القصة بنجاح! 🎉 (150 كلمة مع جمل ومعاني)");

        // تأخير قصير لإظهار رسالة النجاح
        await new Promise((resolve) => setTimeout(resolve, 150));

        // توجيه المستخدم إلى القصة

        // Validate story object before navigation
        if (!response.data || typeof response.data !== "object") {
          console.error("Invalid story data:", response.data);
          setStoryLoadingError("فشل في إنشاء القصة. يرجى المحاولة مرة أخرى.");
          return;
        }

        try {
          navigate("/story-reader", {
            state: {
              story: response.data,
              fromDashboard: true,
            },
          });

          // تأخير قصير للتأكد من أن التوجيه حدث
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (navError) {
          console.error("Navigation error:", navError);
          setStoryLoadingError(
            "فشل في التوجيه إلى القصة. يرجى المحاولة مرة أخرى."
          );
          return;
        }

        // تسجيل أن القصة تم عرضها اليوم
        localStorage.setItem("lastStoryShownDate", today);
        setDailyStoryCompleted(true);

        // إخفاء الـ loading modal بعد التوجيه الناجح
        setIsLoadingStory(false);
        setLoadingMessage("");
      } else {
        // القصة غير موجودة، نحتاج لإنشاء قصة احتياطية
        console.log("Story doesn't exist, creating fallback...");
      }
    } catch (error: any) {
      console.error("Error requesting story:", error);
      if (error.message === "StoryRequestTimeout") {
        setStoryLoadingError(
          "انتهت مهلة إنشاء القصة (150 ثانية). يرجى المحاولة مرة أخرى."
        );
      } else if (
        error.message?.includes("Rate Limit") ||
        error.message?.includes("limit")
      ) {
        setStoryLoadingError(
          "لقد استخدمت حد القصة اليومي. يمكنك طلب قصة جديدة غداً."
        );
      } else {
        setStoryLoadingError("حدث خطأ في طلب القصة. يرجى المحاولة مرة أخرى.");
      }
    } finally {
      setIsLoadingStory(false);
      setLoadingMessage("");
      storyLoadingRef.current = false; // إعادة تعيين ref
    }
  };

  // دالة جديدة لإنشاء قصة احتياطية
  const createFallbackStory = async () => {
    try {
      setLoadingMessage("جاري إنشاء قصة احتياطية...");
      await new Promise((resolve) => setTimeout(resolve, 200));

      const fallbackStory = {
        title: "قصة اليوم - رحلة التعلم",
        content:
          "Once upon a time, a student named " +
          (user?.name || "الطالب") +
          " started learning English. Every day brought new words and challenges. The student worked hard and learned many new words. This journey continues every day, making each word a step towards fluency in English.",
        translation:
          "في يوم من الأيام، بدأ طالب اسمه " +
          (user?.name || "الطالب") +
          " في تعلم اللغة الإنجليزية. كل يوم يجلب كلمات جديدة وتحديات. عمل الطالب بجد وتعلم كلمات جديدة كثيرة. هذه الرحلة تستمر كل يوم، مما يجعل كل كلمة خطوة نحو الطلاقة في اللغة الإنجليزية.",
        words: [
          {
            word: "journey",
            meaning: "رحلة",
            sentence: "Learning English is an exciting journey.",
            sentence_ar: "تعلم اللغة الإنجليزية رحلة مثيرة.",
            status: "UNKNOWN",
            isDailyWord: true,
            canInteract: true,
            isClickable: true,
            hasDefinition: true,
            hasSentence: true,
            color: "blue",
          },
          {
            word: "learning",
            meaning: "تعلم",
            sentence: "Learning new words is fun.",
            sentence_ar: "تعلم كلمات جديدة ممتع.",
            status: "UNKNOWN",
            isDailyWord: true,
            canInteract: true,
            isClickable: true,
            hasDefinition: true,
            hasSentence: true,
            color: "green",
          },
        ],
        totalWords: 2,
        dailyWordsCount: 2,
        complementaryWordsCount: 0,
        date: new Date().toISOString(),
        isCompleted: false,
      };

      setDailyStory(fallbackStory as unknown as DailyStory);
      setLoadingMessage("تم إنشاء قصة احتياطية! 📚");

      await new Promise((resolve) => setTimeout(resolve, 150));

      try {
        navigate("/story-reader", {
          state: {
            story: fallbackStory,
            fromDashboard: true,
          },
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (navError) {
        console.error("Fallback navigation error:", navError);
        setStoryLoadingError(
          "فشل في التوجيه إلى القصة الاحتياطية. يرجى المحاولة مرة أخرى."
        );
        return;
      }

      const now = new Date();
      const today =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0");
      localStorage.setItem("lastStoryShownDate", today);
      setDailyStoryCompleted(true);

      setIsLoadingStory(false);
      setLoadingMessage("");
    } catch (error) {
      console.error("Error creating fallback story:", error);
      setStoryLoadingError(
        "حدث خطأ في إنشاء القصة الاحتياطية. يرجى المحاولة مرة أخرى."
      );
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [progressRes, streakRes, learnedRes] = await Promise.all([
        getProgress(),
        getStreak(),
        getLearnedWords(),
      ]);

      // Handle progress data
      if (progressRes.success && progressRes.data) {
        const progressData = progressRes.data as any;
        const progress: Progress = {
          completedLessons:
            progressData.completedStories || progressData.completedLessons || 0,
          totalLessons:
            progressData.totalStories || progressData.totalLessons || 1,
          progressPercent:
            progressData.progress || progressData.progressPercent || 0,
        };
        setProgress(progress);
      } else {
        // Set default progress if API fails
        setProgress({
          completedLessons: 0,
          totalLessons: 1,
          progressPercent: 0,
        });
      }

      // Handle streak data
      if (streakRes.success && streakRes.data) {
        const data = streakRes.data as any;

        // Handle the new API response structure
        const streakValue = data.currentStreak || data.streak || 0;
        const lastDate = data.lastDate || null;
        const totalDays = data.totalDays || 0;
        const isActive = data.isActive || false;

        setStreak(streakValue);
        setLastStreakDate(lastDate);

        // Handle streak dates - the API doesn't return streakDays array
        // We need to generate it based on the currentStreak and lastDate

        if (data.lastDate && streakValue > 0) {
          // Generate streak dates based on streak count and last date
          const lastDate = new Date(data.lastDate);
          const streakDates: string[] = [];

          // Generate dates for the streak - start from the last date and go backwards
          for (let i = 0; i < streakValue; i++) {
            const date = new Date(lastDate);
            date.setDate(lastDate.getDate() - i);
            streakDates.push(date.toISOString().split("T")[0]);
          }

          setStreakDates(streakDates);
        } else {
          // If no streak data or streak is 0, set empty array
          setStreakDates([]);
        }

        // Check if streak was added today
        const now = new Date();
        const today =
          now.getFullYear() +
          "-" +
          String(now.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(now.getDate()).padStart(2, "0");

        if (data.lastDate) {
          // تحويل التاريخ من UTC إلى المحلي
          const lastDateStr = convertUTCToLocalDate(data.lastDate);
          if (lastDateStr === today) {
            setStreakAddedToday(true);

            // إضافة اليوم الحالي إلى streakDates إذا تم إضافته في قاعدة البيانات
            if (!streakDates.includes(today)) {
              const updatedStreakDates = [...streakDates, today].sort();
              setStreakDates(updatedStreakDates);
            }
          } else {
            setStreakAddedToday(false);
          }
        } else {
          setStreakAddedToday(false);
        }
      } else {
        // Set default streak values if API fails
        setStreak(0);
        setStreakDates([]);
        setStreakAddedToday(false);
      }

      // Handle learned words data
      if (learnedRes && learnedRes.success && learnedRes.data) {
        const learnedData = learnedRes.data as any;
        let totalWords = 0;

        if (learnedData.public && Array.isArray(learnedData.public)) {
          totalWords += learnedData.public.length;
        }
        if (learnedData.private && Array.isArray(learnedData.private)) {
          totalWords += learnedData.private.length;
        }

        setWordsCount(totalWords);
      } else {
        setWordsCount(0);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("حدث خطأ أثناء جلب البيانات");

      // Set default values on error
      setProgress({
        completedLessons: 0,
        totalLessons: 1,
        progressPercent: 0,
      });
      setStreak(0);
      setWordsCount(0);
      setStreakDates([]);
      setStreakAddedToday(false);

      // إظهار رسالة خطأ للمستخدم
      setStreakError("حدث خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.");
      setShowStreakError(true);
      setTimeout(() => setShowStreakError(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStreak = async () => {
    if (isProcessingStreak || addingStreak) {
      return;
    }

    // استخدام التاريخ المحلي
    const now = new Date();
    const today =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");

    // تحقق من localStorage أولاً
    const lastAddedDate = localStorage.getItem("lastStreakAddedDate");

    if (lastAddedDate === today) {
      setStreakAddedToday(true);
      return;
    }

    setAddingStreak(true);
    setIsProcessingStreak(true);

    try {
      // إضافة الستريك محلياً أولاً
      if (!streakDates.includes(today)) {
        const updatedStreakDates = [...streakDates, today].sort();
        setStreakDates(updatedStreakDates);
      }

      // تسجيل في localStorage
      localStorage.setItem("lastStreakAddedDate", today);

      setStreakAddedToday(true);

      // محاولة إضافة الستريك للـ API
      try {
        const streakResponse = await addStreak({
          action: "add",
          date: today,
        });

        if (streakResponse.success) {
          // تحديث الستريك من الـ API
          const updatedStreak = streak + 1;
          setStreak(updatedStreak);
          setLastStreakDate(new Date().toISOString());
          setStreakError(null);

          // إعادة جلب بيانات الستريك من الـ API للتأكد
          try {
            const streakDataResponse = await getStreak();
            if (streakDataResponse.success && streakDataResponse.data) {
              const data = streakDataResponse.data as any;
              const newStreakValue = data.currentStreak || data.streak || 0;
              setStreak(newStreakValue);
            }
          } catch (refreshError) {
            console.error("Error refreshing streak data:", refreshError);
          }
        } else {
          console.error(
            "Failed to add streak to database:",
            streakResponse.error
          );
          setStreakError("فشل في إضافة الستريك للخادم، لكن تم حفظه محلياً");
          setShowStreakError(true);
          setTimeout(() => setShowStreakError(false), 5000);
        }
      } catch (apiError) {
        setStreakError("خطأ في الاتصال بالخادم، لكن تم حفظ الستريك محلياً");
        setShowStreakError(true);
        setTimeout(() => setShowStreakError(false), 5000);
      }

      // إظهار رسالة نجاح
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);

      // تحقق من القصة اليومية وتوجيه المستخدم
      try {
        await checkAndLoadDailyStory();
      } catch (error) {
        console.error("Error in checkAndLoadDailyStory:", error);
        // إذا فشل، جرب التوجيه المباشر
        console.log("Attempting direct navigation to story...");
        // Clear story localStorage to force navigation
        localStorage.removeItem("lastStoryShownDate");

        // Navigate to story reader with a mock story
        const mockStory = {
          id: "test-story",
          title: "قصة تجريبية - Test Story",
          content: "This is a test story content for navigation testing.",
          translation: "هذه قصة تجريبية لاختبار التوجيه.",
          words: [
            {
              word: "test",
              meaning: "اختبار",
              status: "NOT_LEARNED",
              isDailyWord: true,
              type: "unknown",
            },
          ],
          level: "L1",
          createdAt: new Date().toISOString(),
        };

        navigate("/story-reader", {
          state: {
            story: mockStory,
            fromDashboard: true,
          },
        });
      }
    } catch (err) {
      // الستريك تم إضافته محلياً، نستمر
    } finally {
      setAddingStreak(false);
      setIsProcessingStreak(false);
    }
  };

  // دالة جديدة لمعالجة المستخدمين الجدد الذين ليس لديهم ستريك

  const handleInitializeStreak = async () => {
    if (isProcessingStreak || addingStreak) {
      return;
    }

    setAddingStreak(true);
    setIsProcessingStreak(true);

    try {
      // إضافة اليوم الحالي محلياً أولاً
      const now = new Date();
      const today =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0");

      if (!streakDates.includes(today)) {
        const updatedStreakDates = [...streakDates, today].sort();
        setStreakDates(updatedStreakDates);
      }

      // تسجيل في localStorage
      localStorage.setItem("lastStreakAddedDate", today);

      setStreakAddedToday(true);

      // محاولة إنشاء ستريك جديد في الـ API
      try {
        const initResponse = await initializeStreak();

        if (initResponse.success) {
          setStreak(1); // تعيين الستريك إلى 1 للمستخدم الجديد
          setStreakError(null);

          // إعادة جلب بيانات الستريك من الـ API للتأكد
          try {
            const streakDataResponse = await getStreak();
            if (streakDataResponse.success && streakDataResponse.data) {
              const data = streakDataResponse.data as any;
              const newStreakValue = data.currentStreak || data.streak || 0;
              setStreak(newStreakValue);
            }
          } catch (refreshError) {
            console.error(
              "Error refreshing streak data after initialization:",
              refreshError
            );
          }
        } else {
          console.error("Failed to initialize streak:", initResponse.error);
          setStreakError("فشل في إنشاء الستريك في الخادم، لكن تم حفظه محلياً");
          setShowStreakError(true);
          setTimeout(() => setShowStreakError(false), 5000);
        }
      } catch (apiError) {
        console.error("Error initializing streak:", apiError);
        setStreakError("خطأ في الاتصال بالخادم، لكن تم حفظ الستريك محلياً");
        setShowStreakError(true);
        setTimeout(() => setShowStreakError(false), 5000);
      }

      // إظهار رسالة نجاح
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);

      // تحقق من القصة اليومية

      // انتظار قصير للتأكد من تحديث الـ state
      await new Promise((resolve) => setTimeout(resolve, 100));

      try {
        await checkAndLoadDailyStory();
      } catch (error) {
        console.error("Error in checkAndLoadDailyStory:", error);
        // إذا فشل، جرب التوجيه المباشر
        console.log("Attempting direct navigation to story...");
        // Clear story localStorage to force navigation
        localStorage.removeItem("lastStoryShownDate");

        // Navigate to story reader with a mock story
        const mockStory = {
          id: "test-story",
          title: "قصة تجريبية - Test Story",
          content: "This is a test story content for navigation testing.",
          translation: "هذه قصة تجريبية لاختبار التوجيه.",
          words: [
            {
              word: "test",
              meaning: "اختبار",
              status: "NOT_LEARNED",
              isDailyWord: true,
              type: "unknown",
            },
          ],
          level: "L1",
          createdAt: new Date().toISOString(),
        };

        navigate("/story-reader", {
          state: {
            story: mockStory,
            fromDashboard: true,
          },
        });
      }
    } catch (err) {
      console.error("Error initializing streak:", err);
    } finally {
      setAddingStreak(false);
      setIsProcessingStreak(false);
    }
  };

  // دالة جديدة تجمع بين إضافة الستريك وإنشاء القصة
  const handleAddStreakAndCreateStory = async () => {
    setIsLoadingStory(true);
    setLoadingMessage("جاري إضافة اليوم...");

    try {
      // إضافة الستريك أولاً
      const streakResponse = await addStreak({
        action: "add",
        date: new Date().toISOString().split("T")[0],
      });

      if (streakResponse.success) {
        // تحديث الـ state المحلي
        const now = new Date();
        const today =
          now.getFullYear() +
          "-" +
          String(now.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(now.getDate()).padStart(2, "0");
        localStorage.setItem("lastStreakAddedDate", today);
        localStorage.setItem("streakAddedToday", "true");

        // تحديث الـ state
        setStreakAddedToday(true);

        // تحديث الستريك في الـ state - check multiple possible field names
        if (streakResponse?.data && typeof streakResponse.data === "object") {
          const data = streakResponse.data as any;
          const streakCount =
            data.streakCount || data.currentStreak || data.streak || 0;
          setStreak(streakCount);
        }

        // تأخير قصير للتأكد من تحديث الـ state
        await new Promise((resolve) => setTimeout(resolve, 100));

        setLoadingMessage(
          "جاري إنشاء القصة اليومية... ⏱️ (قد يستغرق دقيقة ونصف إلى دقيقتين)"
        );

        // طلب قصة جديدة من الإندبوينت
        try {
          const storyResponse = (await Promise.race([
            requestDailyStory(),
            new Promise(
              (_, reject) =>
                setTimeout(
                  () => reject(new Error("StoryRequestTimeout")),
                  180000
                ) // 180 ثانية للطلب (دقيقة ونصف إلى دقيقتين + buffer)
            ),
          ])) as any;

          if (storyResponse.success && storyResponse.data) {
            setLoadingMessage(
              "تم إنشاء القصة اليومية بنجاح! 🎉 (150 كلمة مع جمل ومعاني)"
            );

            // تأخير قصير لإظهار رسالة النجاح
            await new Promise((resolve) => setTimeout(resolve, 150));

            // توجيه المستخدم إلى القصة
            navigate("/story-reader", {
              state: {
                story: storyResponse.data,
                fromDashboard: true,
              },
            });

            // تسجيل أن القصة تم عرضها اليوم
            localStorage.setItem("lastStoryShownDate", today);
            setDailyStoryCompleted(true);
          } else {
            setLoadingMessage("جاري إنشاء قصة احتياطية...");
            await createFallbackStory();
          }
        } catch (storyError) {
          setLoadingMessage("جاري إنشاء قصة احتياطية...");
          await createFallbackStory();
        }
      } else {
        console.error("❌ Failed to add streak:", streakResponse);
        setStoryLoadingError("فشل في إضافة الستريك. يرجى المحاولة مرة أخرى.");
      }
    } catch (error) {
      console.error("❌ Error in handleAddStreakAndCreateStory:", error);
      setStoryLoadingError("حدث خطأ. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoadingStory(false);
      setLoadingMessage("");
    }
  };

  // Effects
  useEffect(() => {
    // Only fetch data if user is authenticated and not loading
    if (isAuthenticated && !authLoading && user) {
      fetchDashboardData();
      // إزالة fetchDailyStory من هنا لتجنب التحميل المزدوج
    }
  }, [isAuthenticated, authLoading, user]);

  // دمج useEffect للتحقق من الستريك والترحيب في واحد
  // التحديث: إضافة منطق للتحقق من التاريخ اليومي للبوب الترحيبي
  // المشكلة السابقة: البوب الترحيبي كان يظهر مرة واحدة فقط بسبب localStorage
  // الحل: إضافة lastWelcomeShownDate للتحقق من التاريخ اليومي
  useEffect(() => {
    // منع التشغيل المتكرر
    if (welcomeModalChecked.current) {
      return;
    }

    if (user && isAuthenticated && !loading && !authLoading) {
      welcomeModalChecked.current = true;

      const now = new Date();
      const today =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0");

      // تحقق من localStorage للستريك
      const lastAddedDate = localStorage.getItem("lastStreakAddedDate");
      const alreadyAddedTodayLocal = lastAddedDate === today;

      if (alreadyAddedTodayLocal) {
        setStreakAddedToday(true);
        // تحديث streakDates إذا لم يكن اليوم موجود
        if (!streakDates.includes(today)) {
          const updatedStreakDates = [...streakDates, today].sort();
          setStreakDates(updatedStreakDates);
        }
      } else {
        setStreakAddedToday(false);
      }

      // التحقق من وجود ستريك للترحيب - استخدام القيم مباشرة بدلاً من استدعاء hasStreak()
      const hasAnyStreak = streak > 0 || streakAddedToday;
      const isFirstTime = !localStorage.getItem("welcomeShown");

      // تحقق من آخر مرة تم فيها عرض البوب الترحيبي
      const lastWelcomeShown = localStorage.getItem("lastWelcomeShownDate");
      const shouldShowWelcomeToday = lastWelcomeShown !== today;

      console.log("🔍 Welcome Modal Logic Check:", {
        today,
        hasAnyStreak,
        isFirstTime,
        lastWelcomeShown,
        shouldShowWelcomeToday,
        isProcessingStreak,
        alreadyAddedTodayLocal,
        streak,
        streakAddedToday,
      });

      // إذا كان المستخدم جديد أو يحتاج لإضافة ستريك اليوم، اعرض البوب الترحيبي
      if (
        isFirstTime ||
        (!hasAnyStreak &&
          !isProcessingStreak &&
          !alreadyAddedTodayLocal &&
          shouldShowWelcomeToday)
      ) {
        console.log("✅ Showing welcome modal - conditions met");
        setIsNewUser(isFirstTime);
        setShowWelcomeModal(true);
        localStorage.setItem("welcomeShown", "true");
        localStorage.setItem("lastWelcomeShownDate", today);
      } else if (hasAnyStreak || alreadyAddedTodayLocal) {
        // إذا كان هناك ستريك، تأكد من إخفاء البوب الترحيبي
        console.log(
          "❌ Hiding welcome modal - user has streak or already added today"
        );
        setShowWelcomeModal(false);
      } else {
        console.log("❌ Not showing welcome modal - other conditions not met");
      }
    }
  }, [
    user,
    isAuthenticated,
    loading,
    authLoading,
    streak,
    streakDates,
    isProcessingStreak,
  ]);

  // useEffect منفصل للتحقق من القصة المكتملة
  useEffect(() => {
    const now = new Date();
    const today =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");

    const lastStoryShown = localStorage.getItem("lastStoryShownDate");

    // إذا تم عرض القصة اليوم، لا تعرضها مرة أخرى
    if (lastStoryShown === today) {
      setDailyStoryCompleted(true);
    }
  }, []);

  // Add a debug button to clear localStorage for testing
  const debugClearStorage = () => {
    localStorage.removeItem("welcomeShown");
    localStorage.removeItem("lastWelcomeShownDate");
    localStorage.removeItem("lastStreakAddedDate");
    localStorage.removeItem("lastStoryShownDate");
    localStorage.removeItem("streakAddedToday");
    // Force re-render
    window.location.reload();
  };

  // Add a debug function to show welcome modal
  const debugShowWelcomeModal = () => {
    setShowWelcomeModal(true);
    setIsNewUser(true);
  };

  // Add a debug function to reset welcome modal for today
  const debugResetWelcomeForToday = () => {
    const now = new Date();
    const today =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");

    localStorage.removeItem("lastWelcomeShownDate");
    localStorage.removeItem("lastStreakAddedDate");
    setStreakAddedToday(false);
    setShowWelcomeModal(true);
    setIsNewUser(false);
  };

  // Add a debug function to test streak and story creation
  const debugTestStreakAndStory = async () => {
    try {
      const streakResponse = await addStreak({
        action: "add",
        date: new Date().toISOString().split("T")[0],
      });
      const storyResponse = await requestDailyStory();
    } catch (error) {}
  };

  return (
    <>
      <style>{enhancedAnimations}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 transition-colors duration-300">
        {(authLoading || loading) && (
          <Loading isOverlay variant="video" size="xl" text="جاري التحميل..." />
        )}
        {/* Streak Calendar Modal */}
        <Modal open={showStreakModal} onClose={() => setShowStreakModal(false)}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            سلسلة الأيام الأسبوعية
          </h2>
          {(() => {
            return null;
          })()}

          <WeeklyStreakDisplay streakDates={streakDates} />
        </Modal>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center border border-gray-100 dark:border-gray-700 transform animate-pulse">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white text-3xl">🎉</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">
                مبروك! 🎉
              </h2>
              <p className="mb-6 sm:mb-8 text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
                تم إضافة يومك بنجاح! سيتم توجيهك إلى قراءة قصة اليوم...
              </p>
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-white text-2xl">📚</span>
              </div>
            </div>
          </div>
        )}

        {/* Streak Error Message */}
        {showStreakError && streakError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white text-3xl">⚠️</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">
                تنبيه
              </h2>
              <p className="mb-6 sm:mb-8 text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
                {streakError}
              </p>
              <button
                onClick={() => setShowStreakError(false)}
                className="px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-sm sm:text-base"
              >
                حسناً
              </button>
            </div>
          </div>
        )}

        {/* Story Loading Overlay */}
        {isLoadingStory && (
          <Loading
            isOverlay
            variant="video"
            size="xl"
            text={
              storyLoadingError
                ? storyLoadingError
                : loadingMessage || "جاري إنشاء القصة اليومية"
            }
          />
        )}

        {/* Welcome Modal */}
        {showWelcomeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center border border-gray-100 dark:border-gray-700 transform animate-fadeIn">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-3xl">🎉</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">
                أهلاً وسهلاً بك! 🎉
              </h2>
              <p className="mb-6 sm:mb-8 text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
                {isNewUser
                  ? "مرحباً بك في منصة التعلم الذكية! ابدأ رحلتك التعليمية بإضافة أول يوم في سلسلة النجاح."
                  : "لقراءة قصة اليوم، يجب عليك أولاً إضافة يوم في سلسلة النجاح."}
              </p>

              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 text-sm">
                  <span className="text-lg">⏱️</span>
                  <span>
                    إنشاء القصة يستغرق دقيقة ونصف إلى دقيقتين (150 كلمة مع جمل
                    ومعاني)
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={async () => {
                    setShowWelcomeModal(false);
                    if (streak === 0) {
                      await handleInitializeStreak();
                    } else {
                      await handleAddStreak();
                    }
                  }}
                  className="flex-1 px-6 sm:px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-sm sm:text-base"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>🔥</span>
                    <span>إضافة اليوم</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowWelcomeModal(false);
                    clearLocalStorage();
                  }}
                  className="flex-1 px-6 sm:px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-sm sm:text-base"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>🔄</span>
                    <span>إعادة تعيين</span>
                  </div>
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                إضافة اليوم تتيح لك الوصول للقصة اليومية المخصصة (150 كلمة مع
                جمل ومعاني)
              </p>
            </div>
          </div>
        )}

        {/* Daily Story Exam Modal */}
        {showDailyStoryExam && dailyStory && (
          <DailyStoryExam
            onComplete={() => {
              setDailyStoryCompleted(true);
              setShowDailyStoryExam(false);
            }}
            onClose={() => setShowDailyStoryExam(false)}
          />
        )}

        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header Section */}
          {!loading && (
            <div className="mb-8 sm:mb-12 text-center">
              <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-4 sm:px-6 py-2 sm:py-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 transition-colors duration-300">
                <FaBookOpen color="#2563eb" size={24} />
                <span className="text-gray-600 dark:text-gray-300 font-medium text-sm sm:text-base">
                  منصة let<span className="text-orange-500">s</span>peak الذكية
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold  text-gray-900 dark:text-white z-10 mb-3 sm:mb-4 bg-orange-500 bg-clip-text text-transparent">
                أهلاً وسهلاً، {user?.name || "الطالب"}
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed px-4">
                استمر في رحلتك نحو إتقان اللغة الإنجليزية مع أحدث الأدوات
                التعليمية
              </p>
            </div>
          )}

          {/* Content */}
          {(() => {
            return null;
          })()}
          {authLoading || loading ? (
            <Loading
              isOverlay
              variant="video"
              size="xl"
              text="جاري التحميل..."
            />
          ) : error ? (
            <ErrorDisplay error={error} onRetry={fetchDashboardData} />
          ) : user && isAuthenticated ? (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
                {/* Streak Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    console.log("Streak card clicked");
                    setShowStreakModal(true);
                  }}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    setShowStreakModal(true)
                  }
                  className="group outline-none focus:ring-2 focus:ring-orange-400 rounded-2xl sm:rounded-3xl transition-all duration-200 hover:shadow-2xl hover:scale-[1.03] cursor-pointer"
                  style={{ minHeight: 120 }}
                >
                  <StatCard
                    title="سلسلة النجاح"
                    subtitle="أيام الحضور"
                    value={streak}
                    icon={<FaFire color="#fff" size={24} />}
                    gradientFrom="from-orange-500/10"
                    gradientTo="to-red-500/10"
                    hoverBorder="hover:border-orange-200 dark:hover:border-orange-600"
                  >
                    <div className="mb-3 sm:mb-4">
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-1 rounded-full">
                        {streak > 0 ? "🔥 مستمر!" : "ابدأ اليوم"}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-center mb-2 text-sm sm:text-base">
                      {streak > 7 ? "إنجاز رائع! 🎉" : "استمر في التعلم"}
                    </p>
                  </StatCard>
                </div>

                {/* Words Learned Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    navigate("/daily-words", { state: { tab: "learned" } })
                  }
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    navigate("/daily-words", { state: { tab: "learned" } })
                  }
                  className="group outline-none focus:ring-2 focus:ring-green-400 rounded-2xl sm:rounded-3xl transition-all duration-200 hover:shadow-2xl hover:scale-[1.03] cursor-pointer"
                  style={{ minHeight: 120 }}
                >
                  <StatCard
                    title="رصيد المفردات"
                    subtitle="إجمالي الكلمات المتعلمة"
                    value={wordsCount}
                    icon={<FaBookOpen color="#fff" size={24} />}
                    gradientFrom="from-green-500/10"
                    gradientTo="to-emerald-500/10"
                    hoverBorder="hover:border-green-200 dark:hover:border-green-600"
                  >
                    <div className="mb-3 sm:mb-4">
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-1 rounded-full">
                        كلمة
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-center text-sm sm:text-base">
                      {wordsCount > 50 ? "مفردات ممتازة! 📚" : "تعلم المزيد"}
                    </p>
                  </StatCard>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!dailyStoryCompleted) {
                      navigate("/stories/daily");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (
                      (e.key === "Enter" || e.key === " ") &&
                      !dailyStoryCompleted
                    ) {
                      navigate("/stories/daily");
                    }
                  }}
                  className="group outline-none focus:ring-2 focus:ring-green-400 rounded-2xl sm:rounded-3xl transition-all duration-200 hover:shadow-2xl hover:scale-[1.03] cursor-pointer"
                  style={{ minHeight: 120 }}
                >
                  <StatCard
                    title="اكمل القصة اليومية"
                    subtitle="القصة اليومية"
                    value={dailyStoryCompleted ? "قصة مكتملة" : "ابدأ اليوم"}
                    icon={<FaBookOpen color="#fff" size={24} />}
                    gradientFrom="from-green-500/10"
                    gradientTo="to-emerald-500/10"
                    hoverBorder="hover:border-green-200 dark:hover:border-green-600"
                  >
                    {dailyStoryCompleted ? (
                      <div className="flex justify-center items-center gap-2 my-4">
                        <span className="text-2xl ">
                          {
                            ["🎉", "🏆", "✅", "🥇", "👏", "🌟"][
                              Math.floor(Math.random() * 6)
                            ]
                          }
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 overflow-hidden mb-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 sm:h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                            style={{
                              width: "40%",
                            }}
                          />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-center text-sm sm:text-base">
                          منتظر التعلم
                        </p>
                      </>
                    )}
                  </StatCard>
                </div>
              </div>

              {/* Quick Actions Section */}
              <div className="mb-6 sm:mb-8">
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                    الأنشطة التعليمية
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg px-4">
                    اختر النشاط المناسب وابدأ رحلة التعلم
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <ActionButton
                    title="الكلمات اليومية"
                    description="اكتشف مفردات جديدة كل يوم"
                    icon="📖"
                    gradientFrom="from-purple-500/10"
                    gradientTo="to-pink-500/10"
                    hoverBorder="hover:border-purple-200 dark:hover:border-purple-600"
                  />

                  <ActionButton
                    title="إضافة يوم + قصة"
                    description="أضف يوم جديد واحصل على قصة مخصصة (90-120 ثانية)"
                    icon="🚀"
                    gradientFrom="from-green-500/10"
                    gradientTo="to-emerald-500/10"
                    hoverBorder="hover:border-green-200 dark:hover:border-green-600"
                    onClick={handleAddStreakAndCreateStory}
                  />

                  <ActionButton
                    title="قصة اليوم"
                    description={
                      hasStreak()
                        ? "اقرأ قصة مخصصة بكلماتك (90-120 ثانية للإنشاء)"
                        : "أضف يوم أولاً لقراءة القصة"
                    }
                    icon="📚"
                    gradientFrom={
                      hasStreak() ? "from-indigo-500/10" : "from-gray-400/10"
                    }
                    gradientTo={
                      hasStreak() ? "to-blue-500/10" : "to-gray-500/10"
                    }
                    hoverBorder={
                      hasStreak()
                        ? "hover:border-indigo-200 dark:hover:border-indigo-600"
                        : "hover:border-gray-300 dark:hover:border-gray-500"
                    }
                    onClick={async () => {
                      if (hasStreak()) {
                        // تحقق من القصة اليومية وتوجيه المستخدم
                        await checkAndLoadDailyStory();
                      } else {
                        // إظهار البوب الترحيبي
                        setShowWelcomeModal(true);
                      }
                    }}
                  />

                  <ActionButton
                    title="المحادثة مع الذكاء الاصطناعي"
                    description="تحدث مع المساعد الذكي"
                    icon="🤖"
                    gradientFrom="from-indigo-500/10"
                    gradientTo="to-blue-500/10"
                    hoverBorder="hover:border-indigo-200 dark:hover:border-indigo-600"
                    onClick={() => navigate("/chat-with-ai")}
                  />

                  <ActionButton
                    title="الإشعارات"
                    description="استعرض إشعاراتك الأخيرة"
                    icon="🔔"
                    gradientFrom="from-yellow-500/10"
                    gradientTo="to-orange-500/10"
                    hoverBorder="hover:border-yellow-200 dark:hover:border-yellow-600"
                    onClick={() => navigate("/notifications")}
                  />

                  <ActionButton
                    title="الإنجازات"
                    description="استعرض حصيلة إنجازاتك"
                    icon="🏅"
                    gradientFrom="from-emerald-500/10"
                    gradientTo="to-teal-500/10"
                    hoverBorder="hover:border-emerald-200 dark:hover:border-emerald-600"
                    onClick={() => navigate("/achievements")}
                  />
                </div>
              </div>

              {/* Debug Section - Only show in development */}
              {process.env.NODE_ENV === "development" && (
                <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-3">
                    🛠️ أدوات التطوير (Development Tools)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <button
                      onClick={debugResetWelcomeForToday}
                      className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition-colors"
                    >
                      إعادة تعيين البوب الترحيبي لليوم
                    </button>
                    <button
                      onClick={debugShowWelcomeModal}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                    >
                      عرض البوب الترحيبي
                    </button>
                    <button
                      onClick={debugClearStorage}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                    >
                      مسح التخزين المحلي
                    </button>
                    <button
                      onClick={debugTestStreakAndStory}
                      className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                    >
                      اختبار الستريك والقصة
                    </button>
                  </div>
                  <div className="mt-3 text-xs text-yellow-700 dark:text-yellow-300">
                    <p>الحالة الحالية:</p>
                    <p>• الستريك: {streak}</p>
                    <p>• تم إضافة اليوم: {streakAddedToday ? "نعم" : "لا"}</p>
                    <p>
                      • البوب الترحيبي: {showWelcomeModal ? "مُعرض" : "مخفي"}
                    </p>
                    <p>
                      • آخر تاريخ للترحيب:{" "}
                      {localStorage.getItem("lastWelcomeShownDate") ||
                        "غير محدد"}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <span className="text-red-600 text-2xl sm:text-3xl">⚠️</span>
              </div>
              <div className="text-center text-red-600 dark:text-red-400 mb-4 sm:mb-6 text-lg font-medium">
                يرجى تسجيل الدخول للوصول إلى لوحة التحكم
              </div>
              <button
                onClick={() => navigate("/login")}
                className="px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-sm sm:text-base"
              >
                تسجيل الدخول
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
