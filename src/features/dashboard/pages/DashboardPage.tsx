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
  generateDailyStory,
} from "@/core/utils/api";
import { FaBookOpen, FaFire, FaStar, FaChartLine } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import type { DailyStory } from "@/core/types";
import { DailyStoryExam } from "../../daily-words/components/DailyStoryExam";

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

const WelcomeModal: React.FC<{
  onAddStreak: () => void;
  onInitializeStreak: () => void;
  addingStreak: boolean;
  streakDates: string[];
  hasExistingStreak: boolean;
}> = ({
  onAddStreak,
  onInitializeStreak,
  addingStreak,
  streakDates,
  hasExistingStreak,
}) => {
  // استخدام التاريخ المحلي بدلاً من UTC
  const now = new Date();
  const today =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0");
  const isAlreadyCompleted = streakDates.includes(today);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center border border-gray-100 dark:border-gray-700 transform animate-pulse max-h-[90vh] overflow-y-auto">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <HiSparkles color="#fff" size={36} />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          مرحباً بك 👋
        </h2>

        <p className="mb-6 sm:mb-8 text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
          ابدأ رحلتك التعليمية اليوم وسجّل أول يوم في سلسلة النجاح!
        </p>

        <WeeklyStreakDisplay streakDates={streakDates} />
        {(() => {
          console.log("WelcomeModal streakDates:", streakDates);
          return null;
        })()}

        <div className="mt-6 sm:mt-8">
          {isAlreadyCompleted ? (
            <div className="text-green-600 dark:text-green-400 font-bold text-base sm:text-lg">
              ✔️ لقد سجلت يومك بالفعل اليوم!
            </div>
          ) : (
            <div className="space-y-3">
              {!hasExistingStreak && (
                <div className="text-orange-600 dark:text-orange-400 text-sm mb-2">
                  🆕 مرحباً بك! سنقوم بإنشاء أول سلسلة نجاح لك
                </div>
              )}
              <button
                onClick={hasExistingStreak ? onAddStreak : onInitializeStreak}
                disabled={addingStreak}
                className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none font-semibold text-base sm:text-lg"
              >
                {addingStreak ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {hasExistingStreak ? "جاري الإضافة..." : "جاري الإنشاء..."}
                  </div>
                ) : hasExistingStreak ? (
                  "🚀 ابدأ رحلتك الآن"
                ) : (
                  "🎯 إنشاء أول سلسلة نجاح"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/*
 * التحديثات المضافة:
 *
 * 1. إضافة دالة checkAndLoadDailyStory() للتحقق من وجود القصة اليومية قبل التوجيه
 * 2. إضافة دالة generateNewDailyStory() لتوليد قصة جديدة مع رسائل loading مناسبة
 * 3. إضافة loading modal للقصة مع رسائل تقدم مختلفة
 * 4. تعديل handleAddStreak() لتوجيه المستخدم للقصة فقط عند إضافة الستريك لأول مرة
 * 5. إزالة التوجيه التلقائي للقصة من useEffect
 * 6. إضافة localStorage للتحقق من عرض القصة في نفس اليوم
 * 7. إضافة timeout لمنع infinite loop (10 ثانية للقصة، 5 ثانية للكلمات، 60 ثانية للـ AI)
 * 8. منع المحاولات المتكررة للقصة والستريك
 *
 * الرسائل المتوقعة:
 * - "جاري التحقق من القصة اليومية..."
 * - "جاري تحميل القصة اليومية..."
 * - "جاري توليد قصة جديدة..."
 * - "جاري إنشاء القصة من كلماتك..."
 * - "جاري ترجمة القصة..."
 * - "تقريباً انتهينا..."
 * - "تم تحميل القصة بنجاح!"
 * - "تم إنشاء القصة بنجاح!"
 *
 * رسائل الخطأ:
 * - "انتهت مهلة الطلب. يرجى المحاولة مرة أخرى."
 * - "انتهت مهلة جلب الكلمات. يرجى المحاولة مرة أخرى."
 * - "انتهت مهلة إنشاء القصة. يرجى المحاولة مرة أخرى."
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
  const [showWelcome, setShowWelcome] = useState(true);
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

  // دالة مساعدة لتحويل التاريخ من UTC إلى المحلي
  const convertUTCToLocalDate = (utcDateString: string): string => {
    const utcDate = new Date(utcDateString);
    const localDate = new Date(
      utcDate.getTime() + utcDate.getTimezoneOffset() * 60000
    );
    return localDate.toISOString().split("T")[0];
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
    console.log("checkAndLoadDailyStory called");
    const now = new Date();
    const today =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");

    const lastStoryDate = localStorage.getItem("lastStoryShownDate");

    // إذا تم عرض القصة اليوم، لا نحتاج لتحميلها مرة أخرى
    // هذا يضمن أن المستخدم لا يتم توجيهه للقصة إلا مرة واحدة في اليوم
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

    try {
      // محاولة الحصول على القصة الموجودة مع timeout أطول
      // إذا فشل الـ API، ننتقل مباشرة لتوليد قصة جديدة
      let response;
      try {
        response = (await Promise.race([
          getDailyStory(),
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error("Timeout")), 60000) // 60 ثانية timeout
          ),
        ])) as any;
      } catch (apiError) {
        console.log(
          "API call failed, proceeding to generate new story:",
          apiError
        );
        // إذا فشل الـ API، ننتقل لتوليد قصة جديدة
        console.log("Calling generateNewDailyStory...");
        await generateNewDailyStory();
        return;
      }

      if (response.success && response.data) {
        console.log("Daily story exists, loading...");
        setLoadingMessage("جاري تحميل القصة اليومية...");
        console.log("Setting loading message: جاري تحميل القصة اليومية...");

        // تأخير قصير لمحاكاة التحميل
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setDailyStory(response.data as unknown as DailyStory);
        setLoadingMessage("تم تحميل القصة بنجاح!");
        console.log("Setting loading message: تم تحميل القصة بنجاح!");
        console.log("Story loaded successfully, navigating...");

        // تأخير قصير لإظهار رسالة النجاح
        await new Promise((resolve) => setTimeout(resolve, 500));

        // توجيه المستخدم إلى القصة
        navigate("/story-reader", {
          state: {
            story: response.data,
            fromDashboard: true,
          },
        });

        // تسجيل أن القصة تم عرضها اليوم
        localStorage.setItem("lastStoryShownDate", today);
        setDailyStoryCompleted(true);
      } else {
        // القصة غير موجودة، نحتاج لتوليدها
        console.log("Daily story doesn't exist, generating...");
        await generateNewDailyStory();
      }
    } catch (error: any) {
      console.error("Error checking daily story:", error);
      if (error.message === "Timeout") {
        setStoryLoadingError("انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.");
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

  // Function to generate new daily story with loading messages
  const generateNewDailyStory = async () => {
    console.log("generateNewDailyStory called");
    try {
      console.log("Setting loading message: جاري توليد قصة جديدة...");
      setLoadingMessage("جاري توليد قصة جديدة...");

      // اجلب الكلمات المتعلمة مع timeout
      const learnedRes = (await Promise.race([
        getLearnedWords(),
        new Promise(
          (_, reject) =>
            setTimeout(() => reject(new Error("WordsTimeout")), 5000) // 5 ثانية timeout
        ),
      ])) as any;
      const publicWords = Array.isArray((learnedRes.data as any)?.public)
        ? (
            (learnedRes.data as any).public as {
              word: string;
            }[]
          ).map((w) => w.word)
        : [];
      const privateWords = Array.isArray((learnedRes.data as any)?.private)
        ? (
            (learnedRes.data as any).private as {
              word: string;
            }[]
          ).map((w) => w.word)
        : [];

      setLoadingMessage("جاري إنشاء القصة من كلماتك...");
      console.log("Setting loading message: جاري إنشاء القصة من كلماتك...");
      console.log("About to generate story with timeout...");

      // توليد القصة الجديدة مع timeout أطول
      const storyResponse = (await Promise.race([
        generateDailyStory({
          publicWords,
          privateWords,
          userName: user?.name || "الطالب",
          level: String(user?.level || "L1"),
        }),
        new Promise(
          (_, reject) =>
            setTimeout(() => reject(new Error("StoryGenerationTimeout")), 90000) // 90 ثانية timeout للـ AI
        ),
      ])) as any;

      console.log("Story generation completed:", storyResponse);

      if (storyResponse.success && storyResponse.data) {
        setLoadingMessage("جاري ترجمة القصة...");
        console.log("Setting loading message: جاري ترجمة القصة...");
        console.log("Starting translation simulation...");

        // تأخير لمحاكاة الترجمة
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setLoadingMessage("تقريباً انتهينا...");
        console.log("Setting loading message: تقريباً انتهينا...");
        console.log("Almost done...");

        // تأخير قصير
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setDailyStory(storyResponse.data as unknown as DailyStory);
        setLoadingMessage("تم إنشاء القصة بنجاح!");
        console.log("Setting loading message: تم إنشاء القصة بنجاح!");
        console.log("Story created successfully!");

        // تأخير قصير لإظهار رسالة النجاح
        await new Promise((resolve) => setTimeout(resolve, 500));

        // توجيه المستخدم إلى القصة
        console.log("Navigating to story reader...");
        navigate("/story-reader", {
          state: {
            story: storyResponse.data,
            fromDashboard: true,
          },
        });

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
      } else {
        throw new Error("Failed to generate story");
      }
    } catch (error: any) {
      console.error("Error generating daily story:", error);
      if (error.message === "WordsTimeout") {
        setStoryLoadingError("انتهت مهلة جلب الكلمات. يرجى المحاولة مرة أخرى.");
      } else if (error.message === "StoryGenerationTimeout") {
        setStoryLoadingError("انتهت مهلة إنشاء القصة. يرجى المحاولة مرة أخرى.");
      } else {
        setStoryLoadingError("حدث خطأ في إنشاء القصة. يرجى المحاولة مرة أخرى.");
      }
    }
    console.log("generateNewDailyStory finished");
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching dashboard data...");

      // Add a small delay to ensure auth is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

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

        const streakValue = data.currentStreak || data.streak || 0;
        const lastDate = data.lastDate || null;

        console.log("Setting streak values:", { streakValue, lastDate });
        setStreak(streakValue);
        setLastStreakDate(lastDate);

        // Handle streak dates
        console.log("Processing streak dates:", {
          streakDays: data.streakDays,
          isArray: Array.isArray(data.streakDays),
          lastDate: data.lastDate,
          streakValue,
        });

        if (data.streakDays && Array.isArray(data.streakDays)) {
          console.log("Using streakDays from API:", data.streakDays);
          setStreakDates(data.streakDays);
        } else if (data.lastDate && streakValue > 0) {
          // Fallback: Create streak dates based on streak count and last date
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
          // If no streak data, try to create from last date only
          if (data.lastDate) {
            const lastDate = new Date(data.lastDate);
            const today = new Date();
            const todayStr = today.toISOString().split("T")[0];
            const lastDateStr = lastDate.toISOString().split("T")[0];

            // If last date is today or yesterday, consider it as a streak
            if (
              lastDateStr === todayStr ||
              lastDateStr ===
                new Date(today.getTime() - 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0]
            ) {
              setStreakDates([lastDateStr]);
            } else {
              setStreakDates([]);
            }
          } else {
            setStreakDates([]);
          }
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
        }
      } else {
        console.log("Streak response failed:", streakRes);
        // Set default streak values if API fails
        setStreak(0);
        setStreakDates([]);
        setStreakAddedToday(false);

        // إذا كان المستخدم جديد وليس لديه ستريك، اعرض الـ welcome modal
        if (user && isAuthenticated && !authLoading) {
          console.log("New user detected, will show welcome modal");
          setShowWelcome(true);
        }
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
    } finally {
      setLoading(false);
    }
  };

  const handleAddStreak = async () => {
    console.log("handleAddStreak called");
    console.log("handleAddStreak state:", {
      isProcessingStreak,
      addingStreak,
      streakAddedToday,
      user: !!user,
      isAuthenticated,
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

    // تحقق من localStorage أولاً
    const lastAddedDate = localStorage.getItem("lastStreakAddedDate");
    const lastAutoAddedDate = localStorage.getItem("lastAutoStreakDate");

    if (lastAddedDate === today || lastAutoAddedDate === today) {
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
      localStorage.setItem("lastAutoStreakDate", today);

      setStreakAddedToday(true);
      setShowWelcome(false);

      // محاولة إضافة الستريك للـ API
      try {
        const streakResponse = await addStreak({
          action: "add",
          date: today,
        });
        console.log("Streak API response:", streakResponse);

        if (streakResponse.success) {
          console.log("Streak added successfully to database");
          // تحديث lastStreakDate
          setLastStreakDate(new Date().toISOString());
        } else {
          console.error(
            "Failed to add streak to database:",
            streakResponse.error
          );
        }
      } catch (apiError) {
        console.error("Error adding streak to API:", apiError);
        // الستريك تم إضافته محلياً، نستمر
      }

      // إظهار رسالة نجاح
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);

      // تحقق من القصة اليومية وتوجيه المستخدم
      console.log("Calling checkAndLoadDailyStory from handleAddStreak");
      await checkAndLoadDailyStory();
    } catch (err) {
      console.error("Error adding streak:", err);
      // الستريك تم إضافته محلياً، نستمر
    } finally {
      setAddingStreak(false);
      setIsProcessingStreak(false);
    }
  };

  // دالة جديدة لمعالجة المستخدمين الجدد الذين ليس لديهم ستريك
  const handleInitializeStreak = async () => {
    console.log("handleInitializeStreak called");

    if (isProcessingStreak || addingStreak) {
      console.log("Streak is already being processed, skipping...");
      return;
    }

    setAddingStreak(true);
    setIsProcessingStreak(true);

    try {
      console.log("Initializing streak for new user...");

      // محاولة إنشاء ستريك جديد
      const initResponse = await initializeStreak();
      console.log("Initialize streak response:", initResponse);

      if (initResponse.success) {
        console.log("Streak initialized successfully");

        // إضافة اليوم الحالي محلياً
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
        localStorage.setItem("lastAutoStreakDate", today);

        setStreakAddedToday(true);
        setShowWelcome(false);

        // إظهار رسالة نجاح
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);

        // تحقق من القصة اليومية
        await checkAndLoadDailyStory();
      } else {
        console.error("Failed to initialize streak:", initResponse.error);
        // محاولة إعادة تعيين الستريك
        const resetResponse = await resetStreak();
        if (resetResponse.success) {
          console.log("Streak reset successfully, trying to add again...");
          await handleAddStreak();
        }
      }
    } catch (err) {
      console.error("Error initializing streak:", err);
    } finally {
      setAddingStreak(false);
      setIsProcessingStreak(false);
    }
  };

  // Effects
  useEffect(() => {
    console.log("Dashboard useEffect triggered - fetching data");

    // Only fetch data if user is authenticated and not loading
    if (isAuthenticated && !authLoading && user) {
      fetchDashboardData();
      fetchDailyStory();
    }

    // إعادة تعيين streakAddedToday عند بداية يوم جديد
    const now = new Date();
    const today =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");
    const lastAddedDate = localStorage.getItem("lastStreakAddedDate");
    const lastAutoAddedDate = localStorage.getItem("lastAutoStreakDate");

    // تحقق من أن الستريك تم إضافته اليوم
    const alreadyAddedToday =
      lastAddedDate === today || lastAutoAddedDate === today;

    if (alreadyAddedToday) {
      setStreakAddedToday(true);

      // إضافة اليوم الحالي إلى streakDates إذا تم إضافته محلياً
      if (!streakDates.includes(today)) {
        console.log("Adding today to streakDates from localStorage check");
        const updatedStreakDates = [...streakDates, today].sort();
        setStreakDates(updatedStreakDates);
      }
    } else {
      setStreakAddedToday(false);

      // إذا كان المستخدم جديد وليس لديه ستريك، اعرض الـ welcome modal
      if (user && isAuthenticated && streak === 0) {
        console.log(
          "New user detected in first useEffect, showing welcome modal"
        );
        setShowWelcome(true);
      }
    }
  }, [isAuthenticated, authLoading, user]);

  useEffect(() => {
    if (lastStreakDate) {
      const now = new Date();
      const today =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0");
      const lastStreakDateLocal = convertUTCToLocalDate(lastStreakDate);
      setShowWelcome(lastStreakDateLocal !== today);
    }
  }, [lastStreakDate]);

  // إضافة الستريك تلقائياً عند دخول المستخدم (فقط مرة واحدة في اليوم)
  useEffect(() => {
    // استخدام التاريخ المحلي بدلاً من UTC
    const now = new Date();
    const today =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");

    // تحقق من localStorage أولاً
    const lastAddedDate = localStorage.getItem("lastStreakAddedDate");
    const lastAutoAddedDate = localStorage.getItem("lastAutoStreakDate");
    const alreadyAddedTodayLocal =
      lastAddedDate === today || lastAutoAddedDate === today;

    // تحقق من آخر تاريخ streak من الـ backend
    const lastStreakDateStr = lastStreakDate
      ? convertUTCToLocalDate(lastStreakDate)
      : null;

    console.log("Auto streak conditions check:", {
      user: !!user,
      loading,
      authLoading,
      isAuthenticated,
      alreadyAddedTodayLocal,
      isProcessingStreak,
      lastStreakDateStr,
      today,
      willSendPost: !!(
        user &&
        !loading &&
        !authLoading &&
        isAuthenticated &&
        !alreadyAddedTodayLocal &&
        !isProcessingStreak
      ),
    });

    // إضافة الستريك إذا لم يتم إضافته اليوم بعد
    if (
      user &&
      !loading &&
      !authLoading &&
      isAuthenticated &&
      !alreadyAddedTodayLocal &&
      !isProcessingStreak
    ) {
      console.log("Adding streak automatically...");

      // تحقق من الستريك الحالي
      if (streak === 0) {
        console.log("User has no streak, initializing...");
        handleInitializeStreak();
      } else {
        console.log("User has existing streak, adding...");
        handleAddStreak();
      }
    } else if (alreadyAddedTodayLocal) {
      console.log("Streak already added today (localStorage)");
      setStreakAddedToday(true);
      // تحديث streakDates إذا لم يكن اليوم موجود
      if (!streakDates.includes(today)) {
        console.log("Adding today to streakDates from localStorage check");
        const updatedStreakDates = [...streakDates, today].sort();
        setStreakDates(updatedStreakDates);
      }
    } else if (streak === 0 && user && isAuthenticated) {
      // إذا كان المستخدم جديد وليس لديه ستريك، اعرض الـ welcome modal
      console.log("New user with no streak, showing welcome modal");
      setShowWelcome(true);
    }
  }, [user, loading, isProcessingStreak, authLoading, isAuthenticated]); // إزالة lastStreakDate و streakDates و streakAddedToday من dependencies لمنع infinite loop

  // عرض القصة اليومية والامتحان تلقائياً عند بداية يوم جديد
  useEffect(() => {
    const now = new Date();
    const today =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");

    const lastStoryDate = localStorage.getItem("lastDailyStoryDate");

    if (
      user &&
      !loading &&
      dailyStory &&
      lastStoryDate !== today &&
      !dailyStoryCompleted
    ) {
      console.log(
        "Daily story available for today, but not showing automatically..."
      );
      // لا نعرض القصة تلقائياً، فقط نترك المستخدم يختار متى يريد قراءتها
    }
  }, [user, dailyStory, loading, dailyStoryCompleted]);

  // منع إظهار القصة في كل مرة يتم فيها refresh
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

  useEffect(() => {
    const now = new Date();
    const today =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");
    if (streakDates.includes(today)) {
      setShowWelcome(false);
    }

    // إذا كان المستخدم جديد وليس لديه ستريك، اعرض الـ welcome modal
    if (user && isAuthenticated && streak === 0 && !showWelcome) {
      console.log(
        "New user detected in streakDates useEffect, showing welcome modal"
      );
      setShowWelcome(true);
    }
  }, [streakDates, user, isAuthenticated, streak, showWelcome]);

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
    showWelcome,
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

      {/* Story Loading Modal */}
      {isLoadingStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">
              {storyLoadingError ? "حدث خطأ" : "جاري تحميل القصة"}
            </h2>

            {storyLoadingError ? (
              <div className="text-red-600 dark:text-red-400 mb-4 text-sm sm:text-base">
                {storyLoadingError}
              </div>
            ) : (
              <div className="text-gray-700 dark:text-gray-300 mb-4 text-sm sm:text-base">
                {loadingMessage}
              </div>
            )}

            {storyLoadingError ? (
              <button
                onClick={() => {
                  setStoryLoadingError(null);
                  checkAndLoadDailyStory();
                }}
                className="px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-sm sm:text-base"
              >
                🔄 إعادة المحاولة
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-current rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-current rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            )}
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

      {/* Welcome Modal */}
      {showWelcome &&
        user &&
        !streakAddedToday &&
        !addingStreak &&
        !isProcessingStreak && (
          <WelcomeModal
            onAddStreak={handleAddStreak}
            onInitializeStreak={handleInitializeStreak}
            addingStreak={addingStreak}
            streakDates={streakDates}
            hasExistingStreak={streak > 0}
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
            استمر في رحلتك نحو إتقان اللغة الإنجليزية مع أحدث الأدوات التعليمية
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
                        width: progress ? `${progress.progressPercent}%` : "0%",
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
                    {streakAddedToday && (
                      <span className="text-green-600 dark:text-green-400 text-xs font-medium">
                        ✅ تم إضافة اليوم
                      </span>
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
                  title="قصة اليوم"
                  description="اقرأ قصة مخصصة بكلماتك"
                  icon="📚"
                  gradientFrom="from-indigo-500/10"
                  gradientTo="to-blue-500/10"
                  hoverBorder="hover:border-indigo-200 dark:hover:border-indigo-600"
                  onClick={async () => {
                    // تحقق من القصة اليومية وتوجيه المستخدم
                    await checkAndLoadDailyStory();
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
  );
};
