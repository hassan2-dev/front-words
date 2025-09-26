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
      <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
      <span className="text-sm text-gray-600">{text}</span>
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
    { en: "Monday", ar: "الإثنين", short: "Mon" },
    { en: "Tuesday", ar: "الثلاثاء", short: "Tue" },
    { en: "Wednesday", ar: "الأربعاء", short: "Wed" },
    { en: "Thursday", ar: "الخميس", short: "Thu" },
    { en: "Friday", ar: "الجمعة", short: "Fri" },
    { en: "Saturday", ar: "السبت", short: "Sat" },
    { en: "Sunday", ar: "الأحد", short: "Sun" },
  ];

  // عرض حالة التحميل أو الخطأ
  if (calendarLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            جاري تحميل التقويم...
          </p>
        </div>
      </div>
    );
  }

  if (calendarError) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
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
          <p className="text-red-600 dark:text-red-400 mb-2">
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
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
      {/* Header Section with Gradient Background */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          {/* Month Navigation with Arrows and Month Name */}
          <div className="flex items-center justify-center gap-6 mb-6">
            {/* Previous Month Arrow */}
            <button
              onClick={goToPreviousMonth}
              disabled={!canGoToPreviousMonth()}
              className={`
                p-4 rounded-2xl transition-all duration-200 backdrop-blur-sm
                ${
                  canGoToPreviousMonth()
                    ? "bg-white/20 hover:bg-white/30 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                    : "bg-white/10 text-white/50 cursor-not-allowed"
                }
              `}
              title="Previous Month"
            >
              <svg
                className="w-6 h-6"
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

            {/* Month Name and Stats */}
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                {monthName}
              </h2>
              {monthStats.hasStories && (
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/90">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
                    {monthStats.totalStories} Stories
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-300 rounded-full"></div>
                    {monthStats.completedStories} Completed
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-300 rounded-full"></div>
                    {monthStats.averageProgress}% Progress
                  </span>
                </div>
              )}
            </div>

            {/* Next Month Arrow */}
            <button
              onClick={goToNextMonth}
              disabled={!canGoToNextMonth()}
              className={`
                p-4 rounded-2xl transition-all duration-200 backdrop-blur-sm
                ${
                  canGoToNextMonth()
                    ? "bg-white/20 hover:bg-white/30 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                    : "bg-white/10 text-white/50 cursor-not-allowed"
                }
              `}
              title="Next Month"
            >
              <svg
                className="w-6 h-6"
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
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-6">
        {/* Week Header */}
        <div className="grid grid-cols-7 mb-4">
          {weekDays.map((day, idx) => (
            <div key={day.en} className="text-center py-3">
              <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                <span className="hidden sm:inline">{day.en}</span>
                <span className="sm:hidden">{day.short}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2 md:gap-3">
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
                    w-full aspect-square rounded-2xl flex flex-col items-center justify-center
                    transition-all duration-300 ease-out relative overflow-hidden font-semibold
                    ${
                      isToday
                        ? "bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-500 text-white shadow-xl transform hover:scale-110 hover:shadow-2xl ring-4 ring-emerald-200"
                        : hasStory
                        ? isCompleted
                          ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg transform hover:scale-105 hover:shadow-xl"
                          : "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white shadow-lg transform hover:scale-105 hover:shadow-xl"
                        : isPastMonth
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600"
                        : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 hover:shadow-md border border-gray-200 dark:border-gray-600"
                    }
                    ${
                      isDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }
                  `}
                  title={
                    isToday
                      ? "Today's Story - Click to Read"
                      : hasStory
                      ? isCompleted
                        ? `Completed Story (${progress}%) - Click to Re-read`
                        : `Available Story (${progress}%) - Click to Read`
                      : "No Story Available"
                  }
                >
                  {/* Animated background for today */}
                  {isToday && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                  )}

                  {/* Day number */}
                  <span className={`text-lg md:text-xl font-bold z-10`}>
                    {item.day}
                  </span>

                  {/* Story indicators */}
                  {hasStory && (
                    <div className="mt-1 z-10 flex flex-col items-center">
                      {isLoading && isToday ? (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <div
                            className={`px-2 py-1 rounded-lg text-xs font-bold ${
                              isCompleted
                                ? "bg-emerald-200/40 text-white"
                                : "bg-white/30 text-white"
                            }`}
                          >
                            <span className="hidden sm:inline">
                              {isCompleted ? `✓ ${progress}%` : `${progress}%`}
                            </span>
                            <span className="sm:hidden">
                              {isCompleted ? "✓" : `${progress}%`}
                            </span>
                          </div>

                          {/* Progress bar */}
                          {progress > 0 && (
                            <div className="w-8 h-1 bg-white/30 rounded-full mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isCompleted ? "bg-white" : "bg-white/80"
                                }`}
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

                  {/* Status indicators */}
                  {hasStory && isCompleted && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                        <svg
                          className="w-2 h-2 text-green-500"
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

                {/* Hover effect */}
                {(isToday || hasStory) && !isDisabled && (
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl shadow-lg ring-2 ring-emerald-200" />
              <span className="text-gray-700 dark:text-gray-300 font-semibold">
                Today
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg" />
              <span className="text-gray-700 dark:text-gray-300 font-semibold">
                Available
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
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
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                Completed
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded-xl shadow-lg" />
              <span className="text-gray-500 dark:text-gray-400 font-medium">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyStoryCalendar;
