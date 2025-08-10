import React from "react";

interface DailyStoryCalendarProps {
  monthDate?: Date;
  isLoading?: boolean;
  isCompleted?: boolean;
  onSelectToday?: () => void;
}

// Enhanced calendar component with modern design and mobile optimization
export const DailyStoryCalendar: React.FC<DailyStoryCalendarProps> = ({
  monthDate = new Date(),
  isLoading = false,
  isCompleted = false,
  onSelectToday,
}) => {
  const today = new Date();
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startWeekday = (firstDay.getDay() + 6) % 7; // make Monday=0, Sunday=6 for RTL grids
  const totalDays = lastDay.getDate();

  const days: Array<{ day: number; date: Date; isToday: boolean } | null> = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
    days.push({ day: d, date, isToday });
  }

  const monthName = new Intl.DateTimeFormat("ar-SA", {
    month: "long",
    year: "numeric",
  }).format(monthDate);

  return (
    <div className="w-full bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">📅</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              تقويم القصة اليومية
            </h3>
          </div>
        </div>
        <div className="text-center py-2 px-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl border border-blue-200 dark:border-blue-700">
          <div className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
            {monthName}
          </div>
        </div>
      </div>

      {/* Week header with improved mobile design */}
      <div className="grid grid-cols-7 mb-2 sm:mb-3">
        {[
          { full: "الإثنين", short: "إث" },
          { full: "الثلاثاء", short: "ثل" },
          { full: "الأربعاء", short: "أر" },
          { full: "الخميس", short: "خم" },
          { full: "الجمعة", short: "جم" },
          { full: "السبت", short: "سب" },
          { full: "الأحد", short: "أح" },
        ].map((day, idx) => (
          <div 
            key={day.full} 
            className="text-center py-2 px-1"
          >
            <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
              <span className="hidden sm:inline">{day.full}</span>
              <span className="sm:hidden">{day.short}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Days grid with enhanced mobile experience */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((item, idx) => {
          if (!item) {
            return (
              <div
                key={`empty-${idx}`}
                className="aspect-square"
              />
            );
          }

          const isToday = item.isToday;
          const isDisabled = !isToday;

          return (
            <div key={item.day} className="relative">
              <button
                disabled={isDisabled || isLoading}
                onClick={() => onSelectToday && onSelectToday()}
                className={`
                  w-full aspect-square rounded-xl flex flex-col items-center justify-center
                  transition-all duration-300 ease-out relative overflow-hidden
                  ${
                    isToday
                      ? "bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  }
                  ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105 cursor-pointer"}
                  ${!isToday ? "border border-gray-200 dark:border-gray-600" : "border-0"}
                `}
                title={isToday ? "قصة اليوم - اضغط للقراءة" : "متاح قريباً"}
              >
                {/* Background animation for today */}
                {isToday && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                )}

                {/* Day number */}
                <span className={`text-sm sm:text-base font-bold z-10 ${isToday ? 'text-white' : ''}`}>
                  {item.day}
                </span>

                {/* Today indicators */}
                {isToday && (
                  <div className="mt-1 z-10">
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse" />
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className={`px-1.5 py-0.5 rounded-md text-xs font-medium ${
                          isCompleted 
                            ? "bg-emerald-200/30 text-emerald-100" 
                            : "bg-white/20 text-white"
                        }`}>
                          <span className="hidden sm:inline">
                            {isCompleted ? "مكتملة ✓" : "اقرأ اليوم"}
                          </span>
                          <span className="sm:hidden">
                            {isCompleted ? "✓" : "📖"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Subtle dot for non-today dates */}
                {!isToday && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full opacity-30" />
                  </div>
                )}
              </button>

              {/* Ripple effect for today button */}
              {isToday && !isDisabled && (
                <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 bg-white/10 rounded-xl animate-pulse" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend/Status bar */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-purple-600 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">اليوم</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">قريباً</span>
          </div>
          {isCompleted && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-[8px]">✓</span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">مكتملة</span>
            </div>
          )}
        </div>
      </div>

      {/* Today's story preview (if applicable) */}
      {today     && !isLoading && (
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">📚</span>
            <div className="flex-1">
              <p className="text-blue-700 dark:text-blue-300 font-medium">
                {isCompleted ? "تم إكمال قصة اليوم!" : "قصة اليوم جاهزة للقراءة"}
              </p>
              <p className="text-blue-600 dark:text-blue-400 text-xs mt-0.5">
                {isCompleted ? "يمكنك إعادة القراءة" : "اضغط لبدء القراءة"}
              </p>
            </div>
            {!isCompleted && (
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyStoryCalendar;