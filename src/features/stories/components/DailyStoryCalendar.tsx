import React, { useState, useMemo, useEffect } from "react";
import { RiArrowLeftLine, RiArrowRightLine } from "react-icons/ri";
import { getStoriesCalendar, getStoryByDate } from "../../../core/utils/api";

const Loading = ({
  variant = "default",
  text = "Loading...",
  isOverlay = false,
}) => {
  if (isOverlay) {
    return (
      <div className="absolute inset-0 bg-gray-50/80 rounded-lg flex items-center justify-center backdrop-blur-sm">
        <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mr-2"></div>
      <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
    </div>
  );
};

interface Story {
  id: string;
  title: string;
  date: string;
  isCompleted: boolean;
  totalWords: number;
  knownWordsCount: number;
  unknownWordsCount: number;
  partiallyKnownWordsCount: number;
  content?: string;
  translation?: string;
  words?: any[];
  dailyWords?: any[];
}

interface DailyStoryCalendarProps {
  studentId: string;
  monthDate?: Date;
  isLoading?: boolean;
  isCompleted?: boolean;
  onSelectToday?: () => void;
  stories?: Story[];
  onSelectDate?: (date: Date, story?: Story) => void;
  onMonthChange?: (newMonth: Date) => void;
}

export const DailyStoryCalendar: React.FC<DailyStoryCalendarProps> = ({
  studentId,
  monthDate = new Date(),
  isLoading = false,
  isCompleted = false,
  onSelectToday,
  stories = [],
  onSelectDate,
  onMonthChange,
}) => {
  const [currentMonth, setCurrentMonth] = useState(monthDate);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // جلب بيانات التقويم من API
  useEffect(() => {
    const fetchCalendarData = async () => {
      // محاولة الحصول على studentId من localStorage إذا لم يتم تمريره
      let actualStudentId = studentId;

      if (!actualStudentId) {
        try {
          const userData = localStorage.getItem("letspeak_user_data");
          if (userData) {
            const parsed = JSON.parse(userData);
            actualStudentId = parsed.user?.id;
            console.log("🔍 Found studentId in localStorage:", actualStudentId);
          }
        } catch (error) {
          console.error("❌ Error parsing user data from localStorage:", error);
        }
      }

      if (!actualStudentId) {
        console.log("❌ No studentId provided and not found in localStorage");
        return;
      }

      console.log(
        "🔄 Fetching calendar data for student:",
        actualStudentId,
        "year:",
        currentMonth.getFullYear()
      );
      setCalendarLoading(true);
      setCalendarError(null);

      try {
        const year = currentMonth.getFullYear();
        console.log(
          "📡 Making API call to:",
          `/stories/calendar/${actualStudentId}?year=${year}`
        );
        const response = await getStoriesCalendar(actualStudentId, year);

        console.log("📥 API Response:", response);

        if (response.success && response.data) {
          console.log("✅ Calendar data received:", response.data);
          setCalendarData(response.data);
        } else {
          console.log("❌ API call failed:", response);
          setCalendarError("فشل في جلب بيانات التقويم");
        }
      } catch (error) {
        console.error("💥 Error fetching calendar data:", error);
        setCalendarError("حدث خطأ في جلب بيانات التقويم");
      } finally {
        setCalendarLoading(false);
      }
    };

    fetchCalendarData();
  }, [studentId, currentMonth.getFullYear()]);

  // Baghdad timezone helper
  const getBaghdadDate = (date?: Date) => {
    const targetDate = date || new Date();
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Baghdad",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(targetDate);
  };

  const today = new Date();
  const bagdadToday = getBaghdadDate(today);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const calculateProgress = (story: Story): number => {
    if (story.totalWords === 0) return 0;
    const knownWords =
      story.knownWordsCount + story.partiallyKnownWordsCount * 0.5;
    return Math.round((knownWords / story.totalWords) * 100);
  };

  const getStoryForDate = (date: Date): Story | undefined => {
    // استخدام البيانات من التقويم فقط للعرض
    if (calendarData && calendarData.calendar) {
      const month = date.getMonth() + 1;
      const day = date.getDate();

      const monthData = calendarData.calendar.find(
        (m: any) => m.month === month
      );
      if (monthData && monthData.days) {
        const dayData = monthData.days.find((d: any) => d.day === day);
        if (dayData && dayData.hasStory && dayData.story) {
          return {
            id: dayData.story.id,
            title: dayData.story.title,
            date: dayData.date,
            isCompleted: dayData.story.isCompleted,
            totalWords: dayData.story.totalWords,
            knownWordsCount: dayData.story.learnedWords,
            unknownWordsCount:
              dayData.story.totalWords - dayData.story.learnedWords,
            partiallyKnownWordsCount: 0,
          };
        }
      }
    }

    // Fallback إلى البيانات القديمة
    const dateString = date.toISOString().split("T")[0];
    return stories.find((story) => {
      const storyDate = new Date(story.date);
      return (
        storyDate.toDateString() === date.toDateString() ||
        story.date === dateString ||
        storyDate.toISOString().split("T")[0] === dateString
      );
    });
  };

  const fetchFullStoryForDate = async (
    date: Date
  ): Promise<Story | undefined> => {
    try {
      const dateString = date.toISOString().split("T")[0];
      console.log("🔄 Fetching full story data for date:", dateString);

      // التأكد من وجود studentId
      let actualStudentId = studentId;
      if (!actualStudentId) {
        try {
          const userData = localStorage.getItem("letspeak_user_data");
          if (userData) {
            const parsed = JSON.parse(userData);
            actualStudentId = parsed.user?.id;
            console.log("🔍 Found studentId in localStorage:", actualStudentId);
          }
        } catch (error) {
          console.error("❌ Error parsing user data from localStorage:", error);
        }
      }

      if (!actualStudentId) {
        console.error("❌ No studentId available for fetching story");
        return undefined;
      }

      console.log(
        "📊 Using studentId:",
        actualStudentId,
        "for date:",
        dateString
      );
      const response = await getStoryByDate(actualStudentId, dateString);
      if (
        response.success &&
        response.data &&
        (response.data as any).hasStory
      ) {
        console.log(
          "✅ Full story data received:",
          (response.data as any).story
        );

        const storyData = (response.data as any).story!;
        return {
          id: storyData.id,
          title: storyData.title,
          date: storyData.date,
          isCompleted: storyData.isCompleted,
          totalWords: storyData.totalWords,
          knownWordsCount: storyData.learnedWords,
          unknownWordsCount: storyData.totalWords - storyData.learnedWords,
          partiallyKnownWordsCount: 0,
          content: storyData.content,
          translation: storyData.translation,
          words: storyData.words || [],
          dailyWords: storyData.words || [],
        };
      }
    } catch (error) {
      console.error("❌ Error fetching full story data:", error);
    }
    return undefined;
  };

  const isDateCompleted = (date: Date): boolean => {
    // استخدام البيانات من التقويم أولاً
    if (calendarData && calendarData.calendar) {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const monthData = calendarData.calendar.find(
        (m: any) => m.month === month
      );
      if (monthData && monthData.days) {
        const dayData = monthData.days.find((d: any) => d.day === day);
        if (dayData && dayData.hasStory && dayData.story) {
          return dayData.story.isCompleted || false;
        }
      }
    }

    // Fallback إلى البيانات القديمة
    const dateString = date.toISOString().split("T")[0];
    const story = stories.find((story) => {
      const storyDate = new Date(story.date);
      return (
        storyDate.toDateString() === date.toDateString() ||
        story.date === dateString ||
        storyDate.toISOString().split("T")[0] === dateString
      );
    });
    return story?.isCompleted || false;
  };

  const getDateProgress = (date: Date): number => {
    // استخدام البيانات من التقويم أولاً
    if (calendarData && calendarData.calendar) {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const monthData = calendarData.calendar.find(
        (m: any) => m.month === month
      );
      if (monthData && monthData.days) {
        const dayData = monthData.days.find((d: any) => d.day === day);
        if (dayData && dayData.hasStory && dayData.story) {
          return dayData.story.progressPercentage || 0;
        }
      }
    }

    // Fallback إلى البيانات القديمة
    const dateString = date.toISOString().split("T")[0];
    const story = stories.find((story) => {
      const storyDate = new Date(story.date);
      return (
        storyDate.toDateString() === date.toDateString() ||
        story.date === dateString ||
        storyDate.toISOString().split("T")[0] === dateString
      );
    });
    return story ? calculateProgress(story) : 0;
  };

  const goToPreviousMonth = () => {
    const newMonth = new Date(year, month - 1, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(year, month + 1, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const goToToday = () => {
    const todayDate = new Date();
    setCurrentMonth(todayDate);
    onMonthChange?.(todayDate);
  };

  const canGoToNextMonth = () => {
    const nextMonth = new Date(year, month + 1, 1);
    return nextMonth <= today;
  };

  const canGoToPreviousMonth = () => {
    const prevMonth = new Date(year, month - 1, 1);
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), 1);
    return prevMonth >= oneYearAgo;
  };

  const monthStats = useMemo(() => {
    // استخدام البيانات من API الجديد إذا كانت متاحة
    if (calendarData && calendarData.calendar) {
      const monthData = calendarData.calendar.find(
        (m: any) => m.month === month + 1
      );
      if (monthData) {
        const monthStories = monthData.days.filter((d: any) => d.hasStory);
        const completedStories = monthStories.filter(
          (d: any) => d.story?.isCompleted
        );
        const totalProgress = monthStories.reduce(
          (sum: number, d: any) => sum + (d.story?.progressPercentage || 0),
          0
        );
        const averageProgress =
          monthStories.length > 0
            ? Math.round(totalProgress / monthStories.length)
            : 0;

        return {
          totalStories: monthStories.length,
          completedStories: completedStories.length,
          averageProgress,
          hasStories: monthStories.length > 0,
        };
      }
    }

    // Fallback إلى البيانات القديمة
    const monthStories = stories.filter((story) => {
      const storyDate = new Date(story.date);
      return storyDate.getFullYear() === year && storyDate.getMonth() === month;
    });

    const completedStories = monthStories.filter((story) => story.isCompleted);
    const totalProgress = monthStories.reduce(
      (sum, story) => sum + calculateProgress(story),
      0
    );
    const averageProgress =
      monthStories.length > 0
        ? Math.round(totalProgress / monthStories.length)
        : 0;

    return {
      totalStories: monthStories.length,
      completedStories: completedStories.length,
      averageProgress,
      hasStories: monthStories.length > 0,
    };
  }, [calendarData, stories, year, month]);

  const days: Array<{
    day: number;
    date: Date;
    isToday: boolean;
    hasStory: boolean;
    isCompleted: boolean;
    progress: number;
  } | null> = [];

  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
    const hasStory = getStoryForDate(date) !== undefined;
    const isCompleted = isDateCompleted(date);
    const progress = getDateProgress(date);
    days.push({ day: d, date, isToday, hasStory, isCompleted, progress });
  }

  const monthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Baghdad",
  }).format(currentMonth);

  const handleDateClick = async (dayData: {
    day: number;
    date: Date;
    isToday: boolean;
    hasStory: boolean;
    isCompleted: boolean;
    progress: number;
  }) => {
    if (dayData.isToday && onSelectToday) {
      onSelectToday();
    } else if (dayData.hasStory && onSelectDate) {
      try {
        console.log("🔄 Fetching full story for date:", dayData.date);
        const story = await fetchFullStoryForDate(dayData.date);
        console.log("📖 Full story data:", story);
        onSelectDate(dayData.date, story);
      } catch (error) {
        console.error("❌ Error fetching story:", error);
        // Fallback إلى البيانات الأساسية
        const basicStory = getStoryForDate(dayData.date);
        onSelectDate(dayData.date, basicStory);
      }
    }
  };

  const weekDays = [
    { en: "Monday", ar: "الإثنين", short: "M" },
    { en: "Tuesday", ar: "الثلاثاء", short: "T" },
    { en: "Wednesday", ar: "الأربعاء", short: "W" },
    { en: "Thursday", ar: "الخميس", short: "T" },
    { en: "Friday", ar: "الجمعة", short: "F" },
    { en: "Saturday", ar: "السبت", short: "S" },
    { en: "Sunday", ar: "الأحد", short: "S" },
  ];

  // عرض حالة التحميل أو الخطأ
  if (calendarLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-6 sm:p-8 text-center">
          <div className="w-8 h-8 border-3 border-slate-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            جاري تحميل التقويم...
          </p>
        </div>
      </div>
    );
  }

  if (calendarError) {
    return (
      <div className="w-full max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-6 sm:p-8 text-center">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-800">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-2 font-semibold">
            خطأ في تحميل التقويم
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {calendarError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header Section - Professional Design */}
      <div className="bg-slate-700 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-600">
        {/* Month Navigation */}
        <div className="flex items-center justify-between p-4 sm:p-6">
          {/* Previous Month Button */}
          <button
            onClick={goToPreviousMonth}
            disabled={!canGoToPreviousMonth()}
            className={`
              flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200
              ${
                canGoToPreviousMonth()
                  ? "border-slate-500 bg-slate-600 hover:bg-slate-500 text-white active:scale-95 shadow-sm"
                  : "border-slate-600 bg-slate-700 text-slate-400 cursor-not-allowed"
              }
            `}
            title="الشهر السابق"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Month Name and Year - Professional Typography */}
          <div className="text-center flex-1 mx-4">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white mb-2">
              {monthName}
            </h2>
            {/* Today Button */}
            <button
              onClick={goToToday}
              className="text-slate-300 hover:text-white text-sm font-medium px-3 py-1 rounded-md hover:bg-slate-600 transition-colors duration-200 border border-slate-600 hover:border-slate-500"
            >
              اليوم
            </button>
          </div>

          {/* Next Month Button */}
          <button
            onClick={goToNextMonth}
            disabled={!canGoToNextMonth()}
            className={`
              flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200
              ${
                canGoToNextMonth()
                  ? "border-slate-500 bg-slate-600 hover:bg-slate-500 text-white active:scale-95 shadow-sm"
                  : "border-slate-600 bg-slate-700 text-slate-400 cursor-not-allowed"
              }
            `}
            title="الشهر التالي"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Month Statistics - Clean Card Design */}
        {monthStats.hasStories && (
          <div className="mx-4 sm:mx-6 mb-4 sm:mb-6">
            <div className="bg-slate-600/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-slate-500/30">
              <div className="grid grid-cols-3 gap-3 text-center text-white">
                <div className="flex flex-col space-y-1">
                  <span className="text-lg sm:text-xl font-bold">
                    {monthStats.totalStories}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-300 font-medium">
                    إجمالي القصص
                  </span>
                </div>
                <div className="flex flex-col space-y-1 border-x border-slate-500/30 px-2">
                  <span className="text-lg sm:text-xl font-bold text-emerald-300">
                    {monthStats.completedStories}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-300 font-medium">
                    مكتملة
                  </span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-lg sm:text-xl font-bold text-amber-300">
                    {monthStats.averageProgress}%
                  </span>
                  <span className="text-xs sm:text-sm text-slate-300 font-medium">
                    متوسط التقدم
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Content */}
      <div className="p-4 sm:p-6">
        {/* Week Header - Clean Typography */}
        <div className="grid grid-cols-7 mb-4 border-b border-gray-200 dark:border-gray-700">
          {weekDays.map((day, idx) => (
            <div key={day.en} className="text-center py-3">
              <div className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                <span className="hidden sm:block">{day.en.substring(0, 3)}</span>
                <span className="sm:hidden">{day.short}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Days Grid - Professional Clean Design */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((item, idx) => {
            if (!item) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const { isToday, hasStory, isCompleted, progress } = item;
            const isDisabled = !hasStory && !isToday;
            const isPastMonth =
              item.date < new Date(today.getFullYear(), today.getMonth(), 1);

            return (
              <div key={item.day} className="relative group">
                <button
                  disabled={isDisabled || isLoading}
                  onClick={() => handleDateClick(item)}
                  className={`
                    w-full aspect-square rounded-lg flex flex-col items-center justify-center
                    transition-all duration-200 ease-out relative overflow-hidden border
                    text-sm sm:text-base font-medium
                    ${
                      isToday
                        ? "bg-blue-600 text-white border-blue-700 shadow-md hover:bg-blue-700 hover:shadow-lg transform hover:scale-105"
                        : hasStory
                        ? isCompleted
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-sm hover:bg-emerald-700 hover:shadow-md transform hover:scale-105"
                          : "bg-indigo-600 text-white border-indigo-700 shadow-sm hover:bg-indigo-700 hover:shadow-md transform hover:scale-105"
                        : isPastMonth
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700"
                        : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600"
                    }
                    ${
                      isDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:shadow-md"
                    }
                  `}
                  title={
                    isToday
                      ? "قصة اليوم - اضغط للقراءة"
                      : hasStory
                      ? isCompleted
                        ? `قصة مكتملة (${progress}%) - اضغط لإعادة القراءة`
                        : `قصة متاحة (${progress}%) - اضغط للقراءة`
                      : "لا توجد قصة متاحة"
                  }
                >
                  {/* Day number */}
                  <span className="font-semibold text-sm sm:text-base">
                    {item.day}
                  </span>

                  {/* Story indicators - Clean Design */}
                  {hasStory && (
                    <div className="mt-1 flex flex-col items-center space-y-1">
                      {isLoading && isToday ? (
                        <div className="w-2 h-2 sm:w-3 sm:h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          {/* Progress indicator - Simplified */}
                          <div className="text-xs font-medium px-1.5 py-0.5 rounded bg-white/20 text-white">
                            {isCompleted ? "✓" : `${progress}%`}
                          </div>

                          {/* Progress bar - Subtle */}
                          {progress > 0 && (
                            <div className="hidden sm:block w-5 h-0.5 bg-white/30 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-white rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Loading overlay */}
                  {isLoading && !isToday && (
                    <Loading variant="video" text="" isOverlay={true} />
                  )}

                  {/* Completed indicator - Minimalist */}
                  {hasStory && isCompleted && (
                    <div className="absolute top-1 right-1">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white/30 rounded-full flex items-center justify-center border border-white/50">
                        <svg
                          className="w-1 h-1 sm:w-1.5 sm:h-1.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Legend - Professional Clean Design */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded border border-blue-700 shadow-sm" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                اليوم
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-indigo-600 rounded border border-indigo-700 shadow-sm" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                متاحة
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-600 rounded border border-emerald-700 shadow-sm flex items-center justify-center">
                <svg
                  className="w-2 h-2 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                مكتملة
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 shadow-sm" />
              <span className="text-gray-500 dark:text-gray-400 font-medium">
                قريباً
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyStoryCalendar;