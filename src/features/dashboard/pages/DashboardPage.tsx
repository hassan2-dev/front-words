import React, { useEffect, useState } from "react";
import { useAuth } from "../../../core/providers/AuthProvider";
import {
  getProgress,
  getStreak,
  addStreak,
  getLearnedWords,
} from "@/core/utils/api";
import { FaBookOpen, FaFire, FaStar, FaChartLine } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import { useNavigate } from "react-router-dom";

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

  return (
    <div className="w-full max-w-xl mx-auto">
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
  addingStreak: boolean;
  streakDates: string[];
}> = ({ onAddStreak, addingStreak, streakDates }) => {
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

        <div className="mt-6 sm:mt-8">
          {isAlreadyCompleted ? (
            <div className="text-green-600 dark:text-green-400 font-bold text-base sm:text-lg">
              ✔️ لقد سجلت يومك بالفعل اليوم!
            </div>
          ) : (
            <button
              onClick={onAddStreak}
              disabled={addingStreak}
              className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none font-semibold text-base sm:text-lg"
            >
              {addingStreak ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري الإضافة...
                </div>
              ) : (
                "🚀 ابدأ رحلتك الآن"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

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
  const { user } = useAuth();
  const navigate = useNavigate();

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

  // Functions
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [progressRes, streakRes, learnedRes] = await Promise.all([
        getProgress(),
        getStreak(),
        getLearnedWords(),
      ]);

      if (progressRes.success && progressRes.data) {
        setProgress(progressRes.data as unknown as Progress);
      }

      if (streakRes.success && streakRes.data) {
        const data = streakRes.data as unknown as StreakData;
        if (typeof data.streak === "number") {
          setStreak(data.streak);
          setLastStreakDate(data.lastDate || null);

          // Use streakDays from API if available
          if (data.streakDays && Array.isArray(data.streakDays)) {
            setStreakDates(data.streakDays);
          } else if (data.lastDate && data.streak > 0) {
            // Fallback: Create streak dates based on streak count and last date
            const lastDate = new Date(data.lastDate);
            const streakDates: string[] = [];

            // Generate dates for the streak - start from the last date and go backwards
            for (let i = 0; i < data.streak; i++) {
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

          // تحقق من أن آخر تاريخ في الستريك هو اليوم الحالي
          const now = new Date();
          const today =
            now.getFullYear() +
            "-" +
            String(now.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(now.getDate()).padStart(2, "0");
          if (data.lastDate) {
            const lastDateStr = new Date(data.lastDate)
              .toISOString()
              .split("T")[0];
            if (lastDateStr === today) {
              setStreakAddedToday(true);
            } else {
              setStreakAddedToday(false);
            }
          }
        }
      }

      if (
        learnedRes &&
        learnedRes.data &&
        Array.isArray((learnedRes.data as any).public) &&
        Array.isArray((learnedRes.data as any).private)
      ) {
        setWordsCount(
          (learnedRes.data as any).public.length +
            (learnedRes.data as any).private.length
        );
      }
    } catch (err) {
      setError("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStreak = async () => {
    console.log("handleAddStreak called");
    setAddingStreak(true);
    try {
      // استخدام التاريخ المحلي بدلاً من UTC
      const now = new Date();
      const today =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0");
      console.log("Adding streak for date:", today);
      await addStreak({ streak: streak + 1, lastDate: today });
      setStreakAddedToday(true);
      localStorage.setItem("lastStreakAddedDate", today);
      setShowWelcome(false);
      fetchDashboardData();
    } catch (err) {
      console.error("Error adding streak:", err);
    } finally {
      setAddingStreak(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchDashboardData();
    // إعادة تعيين streakAddedToday عند بداية يوم جديد
    const now = new Date();
    const today =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");
    const lastAddedDate = localStorage.getItem("lastStreakAddedDate");
    if (lastAddedDate !== today) {
      setStreakAddedToday(false);
      localStorage.setItem("lastStreakAddedDate", today);
    } else {
      setStreakAddedToday(true);
    }
  }, []);

  useEffect(() => {
    if (lastStreakDate) {
      const now = new Date();
      const today =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0");
      setShowWelcome(lastStreakDate !== today);
    }
  }, [lastStreakDate]);

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
  }, [streakDates]);

  useEffect(() => {
    // استخدام التاريخ المحلي بدلاً من UTC
    const now = new Date();
    const today =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");

    // تحقق من أن المستخدم موجود وأن اليوم الحالي ليس في الستريك
    // وأن آخر تاريخ في الستريك ليس اليوم الحالي وأنه لم يتم إضافة الستريك اليوم بعد
    // وأن البيانات قد تم تحميلها (loading = false)
    const lastStreakDateStr = lastStreakDate
      ? new Date(lastStreakDate).toISOString().split("T")[0]
      : null;

    console.log("Streak Check:", {
      user: !!user,
      userHasId: user?.id,
      loading,
      today,
      localDate: now.toLocaleDateString(),
      streakDates,
      lastStreakDateStr,
      streakAddedToday,
      shouldAdd:
        user &&
        user.id &&
        !loading &&
        !streakDates.includes(today) &&
        lastStreakDateStr !== today &&
        !streakAddedToday,
    });

    if (
      user &&
      user.id &&
      !loading &&
      !streakDates.includes(today) &&
      lastStreakDateStr !== today &&
      !streakAddedToday
    ) {
      console.log("Adding streak automatically...");
      // تأخير قليل لضمان أن جميع البيانات قد تم تحميلها
      setTimeout(() => {
        handleAddStreak();
      }, 1000);
    }
  }, [user, streakDates, lastStreakDate, streakAddedToday, loading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 transition-colors duration-300">
      {/* Streak Calendar Modal */}
      <Modal open={showStreakModal} onClose={() => setShowStreakModal(false)}>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          سلسلة الأيام الأسبوعية
        </h2>
        <WeeklyStreakDisplay streakDates={streakDates} />
      </Modal>
      {/* Welcome Modal */}
      {showWelcome && !user && !streakAddedToday && (
        <WelcomeModal
          onAddStreak={handleAddStreak}
          addingStreak={addingStreak}
          streakDates={streakDates}
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
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorDisplay error={error} onRetry={fetchDashboardData} />
        ) : user?.role === "USER" ? (
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
                onClick={() => setShowStreakModal(true)}
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
                    {!streakAddedToday && (
                      <button
                        onClick={handleAddStreak}
                        disabled={addingStreak}
                        className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                      >
                        {addingStreak ? "جاري..." : "إضافة اليوم"}
                      </button>
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
                  icon="📖"
                  gradientFrom="from-indigo-500/10"
                  gradientTo="to-blue-500/10"
                  hoverBorder="hover:border-indigo-200 dark:hover:border-indigo-600"
                  onClick={async () => {
                    // اجلب الكلمات المتعلمة
                    const learnedRes = await getLearnedWords();
                    const publicWords = Array.isArray(
                      (learnedRes.data as any)?.public
                    )
                      ? (
                          (learnedRes.data as any).public as { word: string }[]
                        ).map((w) => w.word)
                      : [];
                    const privateWords = Array.isArray(
                      (learnedRes.data as any)?.private
                    )
                      ? (
                          (learnedRes.data as any).private as { word: string }[]
                        ).map((w) => w.word)
                      : [];
                    // أرسلهم إلى صفحة القصص مع state
                    navigate("/stories", {
                      state: {
                        publicWords,
                        privateWords,
                        userName: user?.name,
                        level: user?.level,
                      },
                    });
                  }}
                />

                <ActionButton
                  title="التمارين الذكية"
                  description="اختبر مهاراتك وطور قدراتك"
                  icon="🏆"
                  gradientFrom="from-yellow-500/10"
                  gradientTo="to-orange-500/10"
                  hoverBorder="hover:border-yellow-200 dark:hover:border-yellow-600"
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
        ) : null}

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
