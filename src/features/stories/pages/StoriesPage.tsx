import React, { useState, useEffect } from "react";
import { apiClient } from "../../../core/utils/api";
import { API_ENDPOINTS } from "../../../core/config/api";
import { useLocation, useNavigate } from "react-router-dom";
import {
  completeStory,
  generateStoryFromWords,
  getAIRemainingRequests,
} from "../../../core/utils/api";
import { useAuth } from "../../../core/providers/AuthProvider";

// Loader component
const Loader = ({ text = "جاري التحميل..." }) => (
  <div className="text-center py-8 text-lg text-gray-500 animate-pulse">
    {text}
  </div>
);

// Error display with retry
const ErrorDisplay: React.FC<{ error: string; onRetry?: () => void }> = ({
  error,
  onRetry,
}) => (
  <div className="bg-red-100 dark:bg-red-800 rounded-lg shadow p-6 text-center text-red-700 dark:text-red-200 my-4">
    <div>{error}</div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
      >
        إعادة المحاولة
      </button>
    )}
  </div>
);

export const StoriesPage: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [stories, setStories] = useState<any[]>([]);
  const [dailyStory, setDailyStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const [popularStories, setPopularStories] = useState<any[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularError, setPopularError] = useState<string | null>(null);

  // --- State for daily story ---
  const [dailyStoryLoading, setDailyStoryLoading] = useState(false);
  const [dailyStoryError, setDailyStoryError] = useState<string | null>(null);
  const [remainingDailyRequests, setRemainingDailyRequests] =
    useState<number>(0);
  const [wordStatistics, setWordStatistics] = useState<any>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);

  // --- State for learned words ---
  const [learnedWords, setLearnedWords] = useState<{
    public: Array<{ word: string; meaning: string }>;
    private: Array<{ word: string; meaning: string }>;
  }>({ public: [], private: [] });
  const [wordsLoading, setWordsLoading] = useState(true);
  const [wordsError, setWordsError] = useState<string | null>(null);

  const { user } = useAuth();

  // Level mapping
  const levelDescriptions = {
    L1: "beginner English, simple sentences, basic vocabulary",
    L2: "elementary English, simple present and past tense",
    L3: "pre-intermediate English, various tenses, everyday vocabulary",
    L4: "intermediate English, complex sentences, descriptive vocabulary",
    L5: "upper-intermediate English, complex sentences, rich vocabulary",
    L6: "advanced English, sophisticated language, academic vocabulary",
    L7: "very advanced English, professional language, nuanced expressions",
    L8: "native-like English, fluent and natural, idiomatic expressions",
  };

  const levelArabicNames = {
    L1: "مبتدئ",
    L2: "ابتدائي",
    L3: "قبل متوسط",
    L4: "متوسط",
    L5: "فوق متوسط",
    L6: "متقدم",
    L7: "متقدم جداً",
    L8: "مستوى متحدث أصلي",
  };

  function getLevelString(level?: number): string {
    if (!level) return "L1";
    if (level >= 1 && level <= 8) return `L${level}`;
    return "L1";
  }

  // جلب الكلمات المتعلمة
  const fetchLearnedWords = async () => {
    setWordsLoading(true);
    setWordsError(null);
    try {
      const res = await apiClient.get("/words/learned");
      if (res.success && res.data) {
        setLearnedWords(
          res.data as {
            public: Array<{ word: string; meaning: string }>;
            private: Array<{ word: string; meaning: string }>;
          }
        );
      } else {
        setLearnedWords({ public: [], private: [] });
      }
    } catch (err) {
      setWordsError("تعذر جلب الكلمات المتعلمة");
      setLearnedWords({ public: [], private: [] });
    } finally {
      setWordsLoading(false);
    }
  };

  // جلب القصة اليومية
  const fetchDailyStory = async () => {
    setDailyStoryLoading(true);
    setDailyStoryError(null);
    try {
      const response = await apiClient.get(API_ENDPOINTS.DAILY_STORIES.GET);
      if (response.success && response.data) {
        setDailyStory(response.data);
      } else {
        setDailyStoryError("تعذر جلب القصة اليومية");
      }
    } catch (err) {
      setDailyStoryError("حدث خطأ أثناء جلب القصة اليومية");
    } finally {
      setDailyStoryLoading(false);
    }
  };

  // جلب الطلبات المتبقية للقصة اليومية
  const fetchRemainingDailyRequests = async () => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.DAILY_STORIES.REMAINING
      );
      if (response.success && response.data) {
        const data = response.data as { remaining: number };
        setRemainingDailyRequests(data.remaining || 0);
      }
    } catch (error) {
      console.error("خطأ في جلب الطلبات المتبقية للقصة اليومية:", error);
    }
  };

  // جلب إحصائيات الكلمات
  const fetchWordStatistics = async () => {
    setStatisticsLoading(true);
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.DAILY_STORIES.WORD_STATISTICS
      );
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
    fetchLearnedWords();
  }, []);

  useEffect(() => {
    fetchDailyStory();
  }, []);

  useEffect(() => {
    if (dailyStory) {
      fetchWordStatistics();
    }
  }, [dailyStory]);

  // جلب القصص عند تحميل الصفحة
  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      setError(null);
      try {
        // محاولة جلب القصص من API
        const response = await apiClient.get("/daily/stories");
        if (response.success && Array.isArray(response.data)) {
          setStories(response.data);
        } else {
          // إذا لم توجد قصص في API، استخدم قصص افتراضية
          console.log(response.data);
        }
      } catch (err) {
        console.error("خطأ في جلب القصص:", err);
        setError("تعذر جلب القصص");
       
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  const [dailyStoryCompleted, setDailyStoryCompleted] = useState<any[]>([]);

  const fetchDailyStoryCompleted = async () => {
    const response = await apiClient.get("/daily/stories/completed");
    if (response.success && Array.isArray(response.data)) {
      setDailyStoryCompleted(response.data);
    }else{
      setDailyStoryCompleted([]);
    }
  };

  const filteredStories =
    selectedLevel === "All"
      ? stories
      : stories.filter((story) => story.level === selectedLevel);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "L1":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "L2":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "L3":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "L4":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "L5":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "L6":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "L7":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300";
      case "L8":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (loading) return <div>جاري تحميل القصص...</div>;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          القصص التعليمية
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          اقرأ قصص ممتعة لتحسين مهاراتك في اللغة الإنجليزية
        </p>
      </div>

      {/* Daily Story Section */}
      <div className="my-8 bg-gradient-to-br from-green-50 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-slate-800 dark:to-indigo-900 rounded-2xl shadow-xl p-8 border border-green-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="text-4xl">📅</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                القصة اليومية
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                قصة جديدة كل يوم لتحسين مهاراتك
              </p>
            </div>
          </div>
          <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {remainingDailyRequests}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              طلبات متبقية
            </div>
          </div>
        </div>

        {dailyStoryLoading && <Loader text="جاري تحميل القصة اليومية..." />}
        {dailyStoryError && (
          <ErrorDisplay error={dailyStoryError} onRetry={fetchDailyStory} />
        )}

        {dailyStory && !dailyStoryLoading && !dailyStoryError && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">📚</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">
                      {dailyStory.title}
                    </h3>
                    <p className="text-green-100 text-sm">
                      قصة اليوم -{" "}
                      {new Date(dailyStory.date).toLocaleDateString("ar-SA")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
                    {dailyStory.words?.length || 0} كلمة
                  </span>
                  {dailyStory.isCompleted && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500 bg-opacity-20 text-green-100">
                      ✓ مكتملة
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center justify-center gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">📖</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    قصة اليوم
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {dailyStory.words?.length || 0} كلمة
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">⏱️</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    5-10 دقائق
                  </p>
                </div>
              </div>

              {/* Word Statistics */}
              {wordStatistics && !statisticsLoading && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    إحصائيات الكلمات
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {wordStatistics.knownWords || 0}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        معروفة
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {wordStatistics.partiallyKnownWords || 0}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        جزئياً
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {wordStatistics.unknownWords || 0}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        غير معروفة
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>التقدم</span>
                      <span>{wordStatistics.progressPercentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${wordStatistics.progressPercentage || 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleDailyStoryClick}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                  {dailyStory.isCompleted ? "إعادة القراءة" : "ابدأ القراءة"}
                </button>
              </div>

              {dailyStory.isCompleted && (
                <div className="mt-4 text-center text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900 rounded-lg p-3">
                  🎉 تم إكمال القصة اليومية بنجاح!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Popular Stories Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-4 flex items-center gap-2">
          <span>🔥</span> القصص المشهورة
        </h2>
        {popularLoading && (
          <div className="text-gray-500">جاري تحميل القصص المشهورة...</div>
        )}
        {popularError && <div className="text-red-600">{popularError}</div>}
        {!popularLoading && !popularError && popularStories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {popularStories.map((story) => (
              <div
                key={story.id}
                className="bg-yellow-50 dark:bg-yellow-900 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border border-yellow-200 dark:border-yellow-700"
                onClick={() => handleStoryClick(story)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{story.image}</div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-200">
                        مشهور
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {story.title?.arabic || story.titleArabic || story.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {story.title?.english || story.title}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {story.descriptionArabic || story.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ⏱️ {story.duration}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!popularLoading && !popularError && popularStories.length === 0 && (
          <div className="text-gray-500">لا توجد قصص مشهورة حالياً.</div>
        )}
      </div>

      {/* Stories Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          جميع القصص
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <div
              key={story.id}
              className="group bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleStoryClick(story)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{story.image}</div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(
                        story.level
                      )}`}
                    >
                      {levelArabicNames[
                        story.level as keyof typeof levelArabicNames
                      ] || story.levelArabic}
                    </span>
                    {story.isCompleted && (
                      <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm">✓</span>
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  {story.title?.arabic || story.titleArabic || story.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {story.title?.english || story.title}
                </p>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {story.descriptionArabic}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ⏱️ {story.duration}
                  </span>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                    {story.isCompleted ? "إعادة القراءة" : "ابدأ القراءة"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredStories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            لا توجد قصص في هذا المستوى
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            جرب اختيار مستوى آخر أو عد لاحقاً للمزيد من القصص
          </p>
        </div>
      )}

      {/* Progress Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ملخص التقدم
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stories.filter((s) => s.isCompleted).length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              قصص مكتملة
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stories.length - stories.filter((s) => s.isCompleted).length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              قصص متبقية
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {Math.round(
                (stories.filter((s) => s.isCompleted).length / stories.length) *
                  100
              )}
              %
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              نسبة الإكمال
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
