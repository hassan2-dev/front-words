import React, { useState, useEffect } from "react";
import { apiClient } from "../../../core/utils/api";
import { API_ENDPOINTS } from "../../../core/config/api";
import { useNavigate } from "react-router-dom";
import { Loading } from "@/presentation/components";
import DailyStoryCalendar from "../components/DailyStoryCalendar";

// Error display with retry
const ErrorDisplay: React.FC<{ error: string; onRetry?: () => void }> = ({
  error,
  onRetry,
}) => (
  <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl p-4 sm:p-6 text-center border border-red-200 dark:border-red-700/50 backdrop-blur-sm">
    <div className="text-red-700 dark:text-red-300 mb-4 text-sm sm:text-base">{error}</div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
      >
        إعادة المحاولة
      </button>
    )}
  </div>
);

export const StoriesPage: React.FC = () => {
  const [stories, setStories] = useState<any[]>([]);
  const [dailyStory, setDailyStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [popularStories, setPopularStories] = useState<any[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularError, setPopularError] = useState<string | null>(null);

  // State for daily story
  const [dailyStoryLoading, setDailyStoryLoading] = useState(false);
  const [dailyStoryError, setDailyStoryError] = useState<string | null>(null);
  const [remainingDailyRequests, setRemainingDailyRequests] = useState<number>(0);
  const [wordStatistics, setWordStatistics] = useState<any>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);

  // Fetch daily story
  const fetchDailyStory = async () => {
    setDailyStoryLoading(true);
    setDailyStoryError(null);
    try {
      const checkResponse = await apiClient.get("/stories/daily/story/check");

      if (checkResponse.success && (checkResponse.data as any)?.hasStory) {
        const storyResponse = await apiClient.get("/stories/daily/story");
        if (storyResponse.success && storyResponse.data) {
          setDailyStory(storyResponse.data);
        } else {
          setDailyStoryError("تعذر جلب القصة المحفوظة");
        }
      } else {
        setDailyStoryError("لا توجد قصة متاحة للقراءة");
      }
    } catch (err) {
      console.error("خطأ في جلب القصة اليومية:", err);
      setDailyStoryError("حدث خطأ أثناء جلب القصة اليومية");
    } finally {
      setDailyStoryLoading(false);
    }
  };

  // Fetch remaining daily requests
  const fetchRemainingDailyRequests = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.DAILY_STORIES.REMAINING);
      if (response.success && response.data) {
        const data = response.data as { remaining: number };
        setRemainingDailyRequests(data.remaining || 0);
      }
    } catch (error) {
      console.error("خطأ في جلب الطلبات المتبقية للقصة اليومية:", error);
    }
  };

  // Fetch word statistics
  const fetchWordStatistics = async () => {
    setStatisticsLoading(true);
    try {
      const response = await apiClient.get(API_ENDPOINTS.DAILY_STORIES.WORD_STATISTICS);
      if (response.success && response.data) {
        setWordStatistics(response.data);
      }
    } catch (error) {
      console.error("خطأ في جلب إحصائيات الكلمات:", error);
    } finally {
      setStatisticsLoading(false);
    }
  };

  const handleStoryClick = (story: any) => {
    navigate(`/stories/${story.id}`, { state: { story } });
  };

  const handleDailyStoryClick = () => {
    if (dailyStory) {
      navigate(`/stories/daily`, { state: { story: dailyStory } });
    }
  };

  useEffect(() => {
    fetchRemainingDailyRequests();
  }, []);

  useEffect(() => {
    fetchDailyStory();
  }, []);

  useEffect(() => {
    if (dailyStory) {
      fetchWordStatistics();
    }
  }, [dailyStory]);

  // Fetch stories on page load
  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      setPopularError(null);
      try {
        const response = await apiClient.get(API_ENDPOINTS.DAILY_STORIES.GET);
        if (response.success && response.data) {
          const data = response.data as any;
          if (data.stories && Array.isArray(data.stories)) {
            setStories(data.stories);
            setPopularStories(data.stories);
            setPopularError(null);
          } else if (Array.isArray(data)) {
            setStories(data);
            setPopularStories(data);
            setPopularError(null);
          } else {
            console.log("لا توجد قصص في الاستجابة:", data);
            setStories([]);
            setPopularStories([]);
            setPopularError("لا توجد بيانات صحيحة للقصص");
          }
        } else {
          console.log("استجابة غير صحيحة:", response);
          setStories([]);
          setPopularStories([]);
          setPopularError("تعذر جلب القصص");
        }
      } catch (err) {
        console.error("خطأ في جلب القصص:", err);
        setStories([]);
        setPopularStories([]);
        setPopularError("تعذر جلب القصص");
      } finally {
        setLoading(false);
        setPopularLoading(false);
      }
    };

    fetchStories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Loading size="xl" variant="video" text="جاري تحميل القصص..." isOverlay />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 sm:mb-6 shadow-lg">
            <span className="text-2xl sm:text-3xl text-white">📚</span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 sm:mb-4">
            القصص التعليمية
          </h1>
          <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            اقرأ قصصاً ممتعة وتفاعلية لتحسين مهاراتك في اللغة الإنجليزية
          </p>
        </div>

        {/* Daily Story Section */}
        <div className="mb-8 sm:mb-12">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
            {/* Daily Story Header */}
            <div className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4 text-center sm:text-right">
                  <div className="text-3xl sm:text-5xl">📅</div>
                  <div>
                    <h2 className="text-xl sm:text-3xl font-bold text-white mb-1">
                      القصة اليومية
                    </h2>
                    <p className="text-emerald-100 text-sm sm:text-base">
                      قصة جديدة كل يوم لتطوير مهاراتك
                    </p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-3 sm:p-4 text-center min-w-[100px]">
                  <div className="text-2xl sm:text-3xl font-bold text-white">
                    {remainingDailyRequests}
                  </div>
                  <div className="text-xs sm:text-sm text-emerald-100">
                    طلبات متبقية
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Story Content */}
            <div className="p-4 sm:p-8">
              {dailyStoryLoading && (
                <div className="text-center py-8 sm:py-12">
                  <Loading size="lg" variant="video" text="جاري تحميل القصة اليومية..." isOverlay />
                </div>
              )}
              
              {dailyStoryError && (
                <ErrorDisplay error={dailyStoryError} onRetry={fetchDailyStory} />
              )}

              {dailyStory && !dailyStoryLoading && !dailyStoryError && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Story Title & Info */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {dailyStory.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(dailyStory.date).toLocaleDateString("ar-SA")}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                          {dailyStory.words?.length || 0} كلمة
                        </span>
                        {dailyStory.isCompleted && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                            ✓ مكتملة
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Calendar & Stats Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Calendar */}
                    <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-600">
                      <DailyStoryCalendar
                        isLoading={dailyStoryLoading}
                        isCompleted={Boolean(dailyStory.isCompleted)}
                        onSelectToday={handleDailyStoryClick}
                      />
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 content-center">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-2xl p-3 sm:p-4 text-center">
                        <div className="text-2xl sm:text-3xl mb-2">📖</div>
                        <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium">
                          قصة اليوم
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-2xl p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300 mb-1">
                          {dailyStory.words?.length || 0}
                        </div>
                        <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-300">
                          كلمة
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800 rounded-2xl p-3 sm:p-4 text-center col-span-2 sm:col-span-1">
                        <div className="text-2xl sm:text-3xl mb-2">⏱️</div>
                        <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                          5-10 دقائق
                        </p>
                      </div>
                    </div>
                  </div>

                

                  {/* Action Button */}
                  <button
                    onClick={handleDailyStoryClick}
                    className="w-full dark:bg-white/100 dark:hover:bg-white/600 bg-gray-700 hover:bg-gray-800 dark:text-black   text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-2xl transition-all duration-300 shadow-xl transform hover:scale-[1.02] text-sm sm:text-lg"
                  >
                    {dailyStory.isCompleted ? "🔄 إعادة القراءة" : "🚀 ابدأ القراءة"}
                  </button>

                  {dailyStory.isCompleted && (
                    <div className="text-center bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl p-4 border border-green-200 dark:border-green-700">
                      <span className="text-green-700 dark:text-green-300 text-sm sm:text-base font-medium">
                        🎉 تم إكمال القصة اليومية بنجاح!
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* All Stories Section */}
        <div className="mb-8 sm:mb-12">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">📚</span>
              القصص المحفوظة
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              اكتشف مجموعة متنوعة من القصص التعليمية
            </p>
          </div>

          {popularLoading && (
            <div className="text-center py-8 sm:py-12">
              <Loading size="lg" variant="video" text="جاري تحميل القصص..." isOverlay />
            </div>
          )}

          {popularError && (
            <ErrorDisplay error={popularError} />
          )}

          {!popularLoading && !popularError && popularStories.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {popularStories.map((story, index) => (
                <div
                  key={story.id}
                  className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transform hover:scale-[1.02]"
                  onClick={() => handleStoryClick(story)}
                >
                  {/* Card Header with Gradient */}
                  <div className={`h-2 bg-gradient-to-r ${
                    index % 4 === 0 ? 'from-blue-400 to-purple-500' :
                    index % 4 === 1 ? 'from-green-400 to-blue-500' :
                    index % 4 === 2 ? 'from-purple-400 to-pink-500' :
                    'from-orange-400 to-red-500'
                  }`} />

                  <div className="p-4 sm:p-6">
                    {/* Story Icon and Status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-3xl sm:text-4xl">📖</div>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200">
                          محفوظة
                        </span>
                      </div>
                    </div>

                    {/* Story Title */}
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                      {story.title?.split(" - ")?.[0] || story.title}
                    </h3>

                    {/* Story Subtitle */}
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-1">
                      {story.title?.split(" - ")?.[1] || ""}
                    </p>

                    {/* Story Preview */}
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-4 line-clamp-2 leading-relaxed">
                      {story.content?.substring(0, 80)}...
                    </p>

                    {/* Story Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        📝 {story.words?.length || 0} كلمة
                      </span>
                      <div className="text-blue-500 dark:text-blue-400 group-hover:translate-x-1 transition-transform duration-300">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!popularLoading && !popularError && popularStories.length === 0 && (
            <div className="text-center py-12 sm:py-16">
              <div className="text-6xl sm:text-8xl mb-4">📚</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                لا توجد قصص متاحة حالياً
              </h3>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-500">
                سيتم إضافة قصص جديدة قريباً
              </p>
            </div>
          )}
        </div>

        {/* Progress Summary */}
        {stories.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 sm:p-8 border border-white/20 dark:border-gray-700/50">
            <div className="text-center mb-6">
              <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                📈 ملخص التقدم
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                تتبع إنجازاتك في القراءة
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
              <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl p-4 sm:p-6">
                <div className="text-2xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stories.filter((s) => s.isCompleted).length}
                </div>
                <p className="text-sm sm:text-base text-blue-700 dark:text-blue-300 font-medium">
                  قصص مكتملة
                </p>
              </div>
              <div className="text-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-2xl p-4 sm:p-6">
                <div className="text-2xl sm:text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                  {stories.length - stories.filter((s) => s.isCompleted).length}
                </div>
                <p className="text-sm sm:text-base text-orange-700 dark:text-orange-300 font-medium">
                  قصص متبقية
                </p>
              </div>
              <div className="text-center bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-2xl p-4 sm:p-6">
                <div className="text-2xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                  {stories.length > 0 
                    ? Math.round((stories.filter((s) => s.isCompleted).length / stories.length) * 100)
                    : 0
                  }%
                </div>
                <p className="text-sm sm:text-base text-emerald-700 dark:text-emerald-300 font-medium">
                  نسبة الإكمال
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};