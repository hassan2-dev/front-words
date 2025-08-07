import React, { useEffect, useState } from "react";
import { useAuth } from "../../../core/providers/AuthProvider";
import {
  getProgress,
  getStreak,
  addStreak,
  resetStreak,
  initializeStreak,
  getLearnedWords,
  getDailyStory,
} from "@/core/utils/api";
import { FaBookOpen, FaFire, FaStar, FaChartLine } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import type { DailyStory } from "@/core/types";
import { DailyStoryExam } from "../../daily-words/components/DailyStoryExam";

// CSS for animations
const fadeInAnimation = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
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
    <div className="relative">
      <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 rounded-full animate-pulse"></div>
      <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
    </div>
    <div className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 font-medium mt-4 sm:mt-6 text-center px-4">
      جاري تحميل بياناتك الشخصية...
    </div>
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
 *
 * الإندبوينت الجديد: GET /api/stories/daily/story
 * - يدعم Rate Limiting (قصة واحدة يومياً)
 * - يدعم AI Story Generation (15-25 ثانية)
 * - يدعم Fallback Stories (0.5 ثانية)
 * - التكلفة: 0.004-0.006$ للقصة الجديدة
 *
 * الرسائل المتوقعة:
 * - "جاري التحقق من القصة اليومية..."
 * - "جاري تحميل القصة اليومية..."
 * - "جاري إنشاء قصة احتياطية..."
 * - "تم تحميل القصة بنجاح!"
 * - "تم إنشاء قصة احتياطية!"
 *
 * رسائل الخطأ:
 * - "انتهت مهلة الطلب. يرجى المحاولة مرة أخرى."
 * - "حدث خطأ في تحميل القصة. يرجى المحاولة مرة أخرى."
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
    console.log("LocalStorage cleared successfully");

    // إعادة تعيين الحالة
    setStreakAddedToday(false);
    setDailyStoryCompleted(false);
    setShowWelcomeModal(false);
    setIsNewUser(false);

    // إعادة تحميل البيانات
    fetchDashboardData();
  };

  // دالة للتحقق من وجود ستريك
  const hasStreak = (): boolean => {
    console.log("hasStreak check:", {
      streak,
      streakAddedToday,
      result: streak > 0 || streakAddedToday,
    });
    return streak > 0 || streakAddedToday;
  };

  // دالة للتحقق من الستريك في قاعدة البيانات
  const verifyStreakInDatabase = async (): Promise<boolean> => {
    try {
      console.log("🔍 Verifying streak in database...");
      const streakResponse = await getStreak();
      if (streakResponse.success && streakResponse.data) {
        const data = streakResponse.data as any;
        const currentStreak = data.currentStreak || data.streak || 0;
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

    // التحقق من وجود ستريك في قاعدة البيانات مباشرة
    const streakVerified = await verifyStreakInDatabase();
    if (!streakVerified) {
      console.log("Streak not verified in database, retrying...");
      // انتظار إضافي وإعادة المحاولة
      await new Promise((resolve) => setTimeout(resolve, 500)); // تقليل الوقت إلى 500ms
      const retryVerification = await verifyStreakInDatabase();
      if (!retryVerification) {
        console.log("Streak still not verified, showing welcome modal");
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

    console.log("Story check conditions:", {
      today,
      lastStoryDate,
      isSameDay: lastStoryDate === today,
      shouldSkip: lastStoryDate === today,
      hasStreak: hasStreak(),
    });

    // إذا تم عرض القصة اليوم، لا نحتاج لتحميلها مرة أخرى
    if (lastStoryDate === today) {
      console.log("Story already shown today, skipping...");
      setDailyStoryCompleted(true);
      return;
    }

    // منع المحاولات المتكررة
    if (isLoadingStory) {
      console.log("Story is already being loaded, skipping...");
      return;
    }

    console.log("About to start loading story...");

    console.log("Setting isLoadingStory to true");
    setIsLoadingStory(true);
    setStoryLoadingError(null);
    setLoadingMessage("جاري التحقق من القصة اليومية...");
    console.log("Setting loading message: جاري التحقق من القصة اليومية...");

    // تأخير قصير
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // محاولة الحصول على القصة من الإندبوينت الجديد مع timeout محسن
      let response;
      try {
        console.log("Attempting to fetch daily story from new endpoint...");

        // إضافة رسائل تحميل تفصيلية
        const loadingMessages = [
          "جاري التحقق من القصة اليومية...",
          "جاري البحث في قاعدة البيانات...",
          "جاري جلب بيانات المستخدم...",
          "جاري توليد الكلمات اليومية...",
          "جاري اختيار الكلمات المناسبة...",
          "جاري توليد القصة بالذكاء الاصطناعي...",
          "جاري ترجمة القصة...",
          "جاري إثراء الكلمات...",
          "جاري حفظ القصة...",
          "جاري إعداد القصة للعرض...",
        ];

        let messageIndex = 0;
        const messageInterval = setInterval(() => {
          if (messageIndex < loadingMessages.length) {
            setLoadingMessage(loadingMessages[messageIndex]);
            messageIndex++;
          }
        }, 3000); // تغيير الرسالة كل 3 ثوانٍ

        response = (await Promise.race([
          getDailyStory(),
          new Promise(
            (_, reject) =>
              setTimeout(() => reject(new Error("StoryFetchTimeout")), 30000) // 30 ثانية للجلب (محسن للإندبوينت الجديد)
          ),
        ])) as any;

        clearInterval(messageInterval);
        console.log("Daily story fetch response:", response);
      } catch (apiError) {
        console.log("Story fetch failed, creating fallback story:", apiError);
        // إذا فشل الـ API، ننتقل لإنشاء قصة احتياطية
        await createFallbackStory();
        return;
      }

      if (response.success && response.data) {
        console.log("Daily story exists, loading...");
        setLoadingMessage("جاري تحميل القصة اليومية...");
        console.log("Setting loading message: جاري تحميل القصة اليومية...");

        // تأخير قصير لمحاكاة التحميل
        await new Promise((resolve) => setTimeout(resolve, 150));

        setDailyStory(response.data as unknown as DailyStory);
        setLoadingMessage("تم إنشاء القصة بنجاح! 🎉");
        console.log("Setting loading message: تم إنشاء القصة بنجاح! 🎉");
        console.log("Story loaded successfully, navigating...");

        // تأخير قصير لإظهار رسالة النجاح
        await new Promise((resolve) => setTimeout(resolve, 150));

        // توجيه المستخدم إلى القصة
        console.log("Navigating to story reader...");
        console.log("Story data for navigation:", response.data);

        // Validate story object before navigation
        if (!response.data || typeof response.data !== "object") {
          console.error("Invalid story data:", response.data);
          setStoryLoadingError("فشل في إنشاء القصة. يرجى المحاولة مرة أخرى.");
          return;
        }

        console.log("About to call navigate with story data...");
        try {
          console.log("Calling navigate to /story-reader...");
          navigate("/story-reader", {
            state: {
              story: response.data,
              fromDashboard: true,
            },
          });
          console.log("Navigation called successfully");

          // تأخير قصير للتأكد من أن التوجيه حدث
          await new Promise((resolve) => setTimeout(resolve, 100));
          console.log("Navigation delay completed");
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
        console.log("Daily story doesn't exist, creating fallback...");
        await createFallbackStory();
      }
    } catch (error: any) {
      console.error("Error checking daily story:", error);
      if (error.message === "Timeout") {
        setStoryLoadingError("انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.");
      } else if (
        error.message?.includes("Rate Limit") ||
        error.message?.includes("limit")
      ) {
        setStoryLoadingError(
          "لقد استخدمت حد القصة اليومي. يمكنك طلب قصة جديدة غداً."
        );
      } else {
        setStoryLoadingError("حدث خطأ في تحميل القصة. يرجى المحاولة مرة أخرى.");
      }
    } finally {
      console.log("Setting isLoadingStory to false");
      setIsLoadingStory(false);
      setLoadingMessage("");
    }
    console.log("checkAndLoadDailyStory finished");
  };

  // دالة جديدة لإنشاء قصة احتياطية
  const createFallbackStory = async () => {
    console.log("🎯 createFallbackStory called");
    try {
      console.log("Setting loading message: جاري إنشاء قصة احتياطية...");
      setLoadingMessage("جاري إنشاء قصة احتياطية...");

      // تأخير قصير
      await new Promise((resolve) => setTimeout(resolve, 200));

      // إنشاء قصة احتياطية بسيطة
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

      // تأخير قصير لإظهار رسالة النجاح
      await new Promise((resolve) => setTimeout(resolve, 150));

      // توجيه المستخدم إلى القصة
      console.log("Navigating to fallback story reader...");
      console.log("Fallback story data for navigation:", fallbackStory);

      console.log("About to call navigate with fallback story data...");
      try {
        console.log("Calling navigate to /story-reader with fallback...");
        navigate("/story-reader", {
          state: {
            story: fallbackStory,
            fromDashboard: true,
          },
        });
        console.log("Fallback navigation called successfully");

        // تأخير قصير للتأكد من أن التوجيه حدث
        await new Promise((resolve) => setTimeout(resolve, 100));
        console.log("Fallback navigation delay completed");
      } catch (navError) {
        console.error("Fallback navigation error:", navError);
        setStoryLoadingError(
          "فشل في التوجيه إلى القصة الاحتياطية. يرجى المحاولة مرة أخرى."
        );
        return;
      }

      // تسجيل أن القصة تم عرضها اليوم
      const now = new Date();
      const today =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0");
      localStorage.setItem("lastStoryShownDate", today);
      setDailyStoryCompleted(true);

      // إخفاء الـ loading modal بعد التوجيه الناجح
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
      console.log("Fetching dashboard data...");

      const [progressRes, streakRes, learnedRes] = await Promise.all([
        getProgress(),
        getStreak(),
        getLearnedWords(),
      ]);

      console.log("API Responses:", {
        progressRes: {
          success: progressRes.success,
          data: progressRes.data,
          error: progressRes.error,
        },
        streakRes: {
          success: streakRes.success,
          data: streakRes.data,
          error: streakRes.error,
        },
        learnedRes: {
          success: learnedRes.success,
          data: learnedRes.data,
          error: learnedRes.error,
        },
      });

      // Handle progress data
      if (progressRes.success && progressRes.data) {
        console.log("Setting progress:", progressRes.data);
        const progressData = progressRes.data as any;
        const progress: Progress = {
          completedLessons:
            progressData.completedStories || progressData.completedLessons || 0,
          totalLessons:
            progressData.totalStories || progressData.totalLessons || 1,
          progressPercent:
            progressData.progress || progressData.progressPercent || 0,
        };
        console.log("Converted progress:", progress);
        setProgress(progress);
      } else {
        console.log("Progress response failed:", progressRes);
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
        console.log("Streak data from API:", data);

        // Handle the new API response structure
        const streakValue = data.currentStreak || data.streak || 0;
        const lastDate = data.lastDate || null;
        const totalDays = data.totalDays || 0;
        const isActive = data.isActive || false;

        console.log("Setting streak values:", {
          streakValue,
          lastDate,
          totalDays,
          isActive,
        });
        setStreak(streakValue);
        setLastStreakDate(lastDate);

        // Handle streak dates - the API doesn't return streakDays array
        // We need to generate it based on the currentStreak and lastDate
        console.log("Processing streak dates:", {
          currentStreak: data.currentStreak,
          lastDate: data.lastDate,
          totalDays: data.totalDays,
          isActive: data.isActive,
        });

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

          console.log("Generated streak dates:", streakDates);
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
          console.log("Date comparison:", {
            today,
            lastDateStr,
            originalLastDate: data.lastDate,
            isToday: lastDateStr === today,
          });
          if (lastDateStr === today) {
            setStreakAddedToday(true);

            // إضافة اليوم الحالي إلى streakDates إذا تم إضافته في قاعدة البيانات
            if (!streakDates.includes(today)) {
              console.log("Adding today to streakDates from database check");
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
        console.log("Streak response failed:", streakRes);
        // Set default streak values if API fails
        setStreak(0);
        setStreakDates([]);
        setStreakAddedToday(false);
      }

      // Handle learned words data
      console.log("Learned words response:", learnedRes);
      if (learnedRes && learnedRes.success && learnedRes.data) {
        const learnedData = learnedRes.data as any;
        let totalWords = 0;

        if (learnedData.public && Array.isArray(learnedData.public)) {
          totalWords += learnedData.public.length;
        }
        if (learnedData.private && Array.isArray(learnedData.private)) {
          totalWords += learnedData.private.length;
        }

        console.log("Setting words count:", { totalWords });
        setWordsCount(totalWords);
      } else {
        console.log("Learned words data is invalid:", learnedRes);
        setWordsCount(0);
      }

      console.log("Dashboard data fetch completed successfully");
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
    console.log("=== handleAddStreak called ===");
    console.log("Current state before addStreak:", {
      streak,
      streakAddedToday,
      isProcessingStreak,
      addingStreak,
    });

    if (isProcessingStreak || addingStreak) {
      console.log("Streak is already being processed, skipping...");
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

    console.log("Today's date:", today);

    // تحقق من localStorage أولاً
    const lastAddedDate = localStorage.getItem("lastStreakAddedDate");

    console.log("localStorage dates:", {
      lastAddedDate,
      today,
    });

    if (lastAddedDate === today) {
      console.log("Streak already added today (localStorage), skipping...");
      setStreakAddedToday(true);
      return;
    }

    setAddingStreak(true);
    setIsProcessingStreak(true);

    try {
      console.log("Adding streak for date:", today);

      // إضافة الستريك محلياً أولاً
      if (!streakDates.includes(today)) {
        console.log("Adding today to streakDates locally");
        const updatedStreakDates = [...streakDates, today].sort();
        setStreakDates(updatedStreakDates);
      }

      // تسجيل في localStorage
      localStorage.setItem("lastStreakAddedDate", today);

      setStreakAddedToday(true);

      // محاولة إضافة الستريك للـ API
      try {
        console.log("=== CALLING addStreak API ===");
        console.log("API call data:", {
          action: "add",
          date: today,
        });

        const streakResponse = await addStreak({
          action: "add",
          date: today,
        });

        console.log("=== API RESPONSE RECEIVED ===");
        console.log("Streak API response:", streakResponse);
        console.log("Response success:", streakResponse.success);
        console.log("Response data:", streakResponse.data);
        console.log("Response error:", streakResponse.error);

        if (streakResponse.success) {
          console.log("Streak added successfully to database");
          // تحديث الستريك من الـ API
          const updatedStreak = streak + 1;
          setStreak(updatedStreak);
          setLastStreakDate(new Date().toISOString());
          setStreakError(null);

          // إعادة جلب بيانات الستريك من الـ API للتأكد
          try {
            console.log("Refreshing streak data from API...");
            const streakDataResponse = await getStreak();
            console.log("Streak refresh response:", streakDataResponse);
            if (streakDataResponse.success && streakDataResponse.data) {
              const data = streakDataResponse.data as any;
              const newStreakValue = data.currentStreak || data.streak || 0;
              console.log("Updated streak from API:", newStreakValue);
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
        console.error("=== API ERROR OCCURRED ===");
        console.error("Error adding streak to API:", apiError);
        console.error("Error type:", typeof apiError);
        console.error(
          "Error message:",
          apiError instanceof Error ? apiError.message : apiError
        );
        console.error(
          "Error stack:",
          apiError instanceof Error ? apiError.stack : "No stack trace"
        );
        setStreakError("خطأ في الاتصال بالخادم، لكن تم حفظ الستريك محلياً");
        setShowStreakError(true);
        setTimeout(() => setShowStreakError(false), 5000);
      }

      // إظهار رسالة نجاح
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);

      console.log("✅ Streak saved, now proceeding to check daily story...");
      // تحقق من القصة اليومية وتوجيه المستخدم
      console.log("Calling checkAndLoadDailyStory from handleAddStreak");
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
      console.error("=== GENERAL ERROR IN handleAddStreak ===");
      console.error("Error adding streak:", err);
      // الستريك تم إضافته محلياً، نستمر
    } finally {
      console.log("=== FINALLY BLOCK EXECUTED ===");
      setAddingStreak(false);
      setIsProcessingStreak(false);
    }
  };

  // دالة جديدة لمعالجة المستخدمين الجدد الذين ليس لديهم ستريك

  const handleInitializeStreak = async () => {
    console.log("=== handleInitializeStreak called ===");
    console.log("Current state before initializeStreak:", {
      streak,
      streakAddedToday,
      isProcessingStreak,
      addingStreak,
    });

    if (isProcessingStreak || addingStreak) {
      console.log("Streak is already being processed, skipping...");
      return;
    }

    setAddingStreak(true);
    setIsProcessingStreak(true);

    try {
      console.log("Initializing streak for new user...");

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
        console.log("Calling initializeStreak API...");
        const initResponse = await initializeStreak();
        console.log("Initialize streak response:", initResponse);

        if (initResponse.success) {
          console.log("Streak initialized successfully");
          setStreak(1); // تعيين الستريك إلى 1 للمستخدم الجديد
          setStreakError(null);

          // إعادة جلب بيانات الستريك من الـ API للتأكد
          try {
            console.log("Refreshing streak data after initialization...");
            const streakDataResponse = await getStreak();
            console.log(
              "Streak refresh response after initialization:",
              streakDataResponse
            );
            if (streakDataResponse.success && streakDataResponse.data) {
              const data = streakDataResponse.data as any;
              const newStreakValue = data.currentStreak || data.streak || 0;
              console.log(
                "Updated streak from API after initialization:",
                newStreakValue
              );
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

      console.log(
        "✅ Streak initialized, now proceeding to check daily story..."
      );
      // تحقق من القصة اليومية
      console.log("Calling checkAndLoadDailyStory from handleInitializeStreak");

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
    console.log("🚀 handleAddStreakAndCreateStory called");
    setLoadingMessage("جاري إضافة اليوم وإنشاء القصة...");

    try {
      // إضافة الستريك أولاً
      console.log("Adding streak...");
      const streakResponse = await addStreak({ action: "daily_login" });

      if (streakResponse.success) {
        console.log("Streak added successfully:", streakResponse.data);

        // تحديث الـ state المحلي
        const now = new Date();
        const today =
          now.getFullYear() +
          "-" +
          String(now.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(now.getDate()).padStart(2, "0");
        localStorage.setItem("lastStreakDate", today);
        localStorage.setItem("streakAddedToday", "true");

        // تحديث الـ state
        setStreakAddedToday(true);
        // تحديث الستريك في الـ state
        if (
          streakResponse?.data &&
          typeof streakResponse.data === "object" &&
          "streak" in streakResponse.data
        ) {
          setStreak((streakResponse.data as any).streak);
        }

        // تأخير قصير للتأكد من تحديث الـ state
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log("Streak added, now checking for daily story...");
        setLoadingMessage("جاري التحقق من القصة اليومية...");

        // محاولة الحصول على القصة اليومية من الإندبوينت الجديد
        try {
          const storyResponse = (await Promise.race([
            getDailyStory(),
            new Promise(
              (_, reject) =>
                setTimeout(() => reject(new Error("StoryFetchTimeout")), 30000) // 30 ثانية للجلب (محسن للإندبوينت الجديد)
            ),
          ])) as any;

          if (storyResponse.success && storyResponse.data) {
            console.log("Daily story found:", storyResponse.data);
            setLoadingMessage("تم إنشاء القصة اليومية! 🎉");

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
            console.log("No daily story found, creating fallback...");
            setLoadingMessage("جاري إنشاء قصة احتياطية...");
            await createFallbackStory();
          }
        } catch (storyError) {
          console.log(
            "Error fetching daily story, creating fallback:",
            storyError
          );
          setLoadingMessage("جاري إنشاء قصة احتياطية...");
          await createFallbackStory();
        }
      } else {
        console.error("Failed to add streak:", streakResponse);
        setStoryLoadingError("فشل في إضافة الستريك. يرجى المحاولة مرة أخرى.");
      }
    } catch (error) {
      console.error("Error in handleAddStreakAndCreateStory:", error);
      setStoryLoadingError("حدث خطأ. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoadingMessage("");
    }
  };

  // Effects
  useEffect(() => {
    console.log("Dashboard useEffect triggered - fetching data");

    // Only fetch data if user is authenticated and not loading
    if (isAuthenticated && !authLoading && user) {
      fetchDashboardData();
      // إزالة fetchDailyStory من هنا لتجنب التحميل المزدوج
    }
  }, [isAuthenticated, authLoading, user]);

  // دمج useEffect للتحقق من الستريك والترحيب في واحد
  useEffect(() => {
    if (user && isAuthenticated && !loading && !authLoading) {
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
          console.log("Adding today to streakDates from localStorage check");
          const updatedStreakDates = [...streakDates, today].sort();
          setStreakDates(updatedStreakDates);
        }
      } else {
        setStreakAddedToday(false);
      }

      // التحقق من وجود ستريك للترحيب
      const hasAnyStreak = hasStreak();
      const isFirstTime = !localStorage.getItem("welcomeShown");

      console.log("Welcome modal check:", {
        hasAnyStreak,
        isFirstTime,
        streak,
        streakAddedToday,
        user: user.name,
      });

      // إذا كان المستخدم جديد أو ليس لديه ستريك، اعرض البوب الترحيبي
      // تحقق من الستريك في قاعدة البيانات أيضاً
      if (
        isFirstTime ||
        (!hasAnyStreak && !isProcessingStreak && !alreadyAddedTodayLocal)
      ) {
        console.log(
          "Showing welcome modal for new user or user without streak"
        );
        setIsNewUser(true);
        setShowWelcomeModal(true);
        localStorage.setItem("welcomeShown", "true");
      } else if (hasAnyStreak || alreadyAddedTodayLocal) {
        // إذا كان هناك ستريك، تأكد من إخفاء البوب الترحيبي
        console.log("User has streak, hiding welcome modal");
        setShowWelcomeModal(false);
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

  console.log("Dashboard render state:", {
    loading,
    error,
    isLoadingStory,
    loadingMessage,
    storyLoadingError,
    progress: progress
      ? {
          completedLessons: progress.completedLessons,
          totalLessons: progress.totalLessons,
          progressPercent: progress.progressPercent,
        }
      : null,
    streak,
    wordsCount,
    streakAddedToday,
    isProcessingStreak,
    user: user
      ? {
          name: user.name || "الطالب",
          role: user.role || "USER",
          id: user.id,
          fullUser: user,
        }
      : null,
  });

  console.log(
    "Dashboard render - isLoadingStory:",
    isLoadingStory,
    "loadingMessage:",
    loadingMessage
  );
  return (
    <>
      <style>{fadeInAnimation}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 transition-colors duration-300">
        {/* Streak Calendar Modal */}
        <Modal open={showStreakModal} onClose={() => setShowStreakModal(false)}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            سلسلة الأيام الأسبوعية
          </h2>
          {(() => {
            console.log("Modal streakDates:", streakDates);
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

        {/* Story Loading Modal */}
        {isLoadingStory && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 sm:p-10 max-w-lg w-full text-center border border-gray-100 dark:border-gray-700 transform scale-100 animate-fadeIn">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
                {storyLoadingError ? "حدث خطأ" : "جاري تحميل القصة اليومية"}
              </h2>

              {storyLoadingError ? (
                <div className="text-red-600 dark:text-red-400 mb-6 text-base sm:text-lg">
                  {storyLoadingError}
                </div>
              ) : (
                <div className="text-gray-700 dark:text-gray-300 mb-6 text-base sm:text-lg font-medium">
                  {loadingMessage}
                </div>
              )}

              {storyLoadingError ? (
                <button
                  onClick={() => {
                    setStoryLoadingError(null);
                    checkAndLoadDailyStory();
                  }}
                  className="px-8 sm:px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-base sm:text-lg"
                >
                  🔄 إعادة المحاولة
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3 text-blue-600 dark:text-blue-400">
                    <div className="w-3 h-3 bg-current rounded-full animate-bounce"></div>
                    <div
                      className="w-3 h-3 bg-current rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-3 h-3 bg-current rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    يرجى الانتظار، هذا قد يستغرق بضع دقائق...
                  </div>
                </div>
              )}
            </div>
          </div>
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
                إضافة اليوم تتيح لك الوصول للقصة اليومية المخصصة
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
          <div className="mb-8 sm:mb-12 text-center">
            <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-4 sm:px-6 py-2 sm:py-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 transition-colors duration-300">
              <FaBookOpen color="#2563eb" size={24} />
              <span className="text-gray-600 dark:text-gray-300 font-medium text-sm sm:text-base">
                منصة التعلم الذكية
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

          {/* Content */}
          {(() => {
            console.log("Render condition check:", {
              loading,
              error,
              authLoading,
              userRole: user?.role || "USER",
              userExists: !!user,
              isAuthenticated,
              willShowContent:
                !loading && !error && !authLoading && !!user && isAuthenticated,
            });
            return null;
          })()}
          {authLoading ? (
            <LoadingSpinner />
          ) : loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorDisplay error={error} onRetry={fetchDashboardData} />
          ) : user && isAuthenticated ? (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
                {/* Progress Card */}
                <StatCard
                  title="تقدمك الشخصي"
                  subtitle="مسيرتك التعليمية"
                  value={progress ? `${progress.progressPercent}%` : "0%"}
                  icon={<FaChartLine color="#fff" size={24} />}
                  gradientFrom="from-blue-500/10"
                  gradientTo="to-cyan-500/10"
                  hoverBorder="hover:border-blue-200 dark:hover:border-blue-600"
                >
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-1 rounded-full">
                        اليوم
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 sm:h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{
                          width: progress
                            ? `${progress.progressPercent}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-center text-sm sm:text-base">
                    {progress
                      ? `${progress.completedLessons} من ${progress.totalLessons} درساً مكتملاً`
                      : "لم تبدأ بعد"}
                  </p>
                </StatCard>

                {/* Streak Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    console.log(
                      "Streak card clicked, current streakDates:",
                      streakDates
                    );
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
                    <div className="text-center mt-2">
                      {streakAddedToday ? (
                        <span className="text-green-600 dark:text-green-400 text-xs font-medium">
                          ✅ تم إضافة اليوم
                        </span>
                      ) : (
                        user &&
                        isAuthenticated &&
                        !isProcessingStreak && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (streak === 0) {
                                handleInitializeStreak();
                              } else {
                                handleAddStreak();
                              }
                            }}
                            disabled={isProcessingStreak || addingStreak}
                            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xs font-medium px-3 py-1 rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            {isProcessingStreak || addingStreak ? (
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                جاري الإضافة...
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <FaFire className="text-xs" />
                                إضافة اليوم
                              </div>
                            )}
                          </button>
                        )
                      )}
                    </div>
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
                    description="أضف يوم جديد واحصل على قصة مخصصة"
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
                        ? "اقرأ قصة مخصصة بكلماتك"
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
                  />
                </div>
              </div>
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

          {/* Motivational Quote */}
          <div className="text-center mt-12 sm:mt-16">
            <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg mx-4">
              <FaStar color="#fde047" size={20} />
              <FaStar color="#fde047" size={20} />
              <span className="font-medium text-sm sm:text-base lg:text-lg text-center">
                "التعلم رحلة مستمرة، وكل خطوة تقربك من هدفك"
              </span>
              <FaStar color="#fde047" size={20} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
