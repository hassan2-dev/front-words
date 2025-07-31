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

// Enhanced Confirmation Modal
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  words: string[];
  remainingRequests: number;
}> = ({ isOpen, onClose, onConfirm, words, remainingRequests }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            تأكيد إنشاء القصة
          </h3>
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              سيتم إنشاء قصة مخصصة من الكلمات التالية:
            </p>
            <div className="flex flex-wrap gap-2">
              {words.slice(0, 10).map((word, index) => (
                <span
                  key={index}
                  className="bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs"
                >
                  {word}
                </span>
              ))}
              {words.length > 10 && (
                <span className="text-blue-600 dark:text-blue-400 text-xs">
                  +{words.length - 10} أكثر
                </span>
              )}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-800 dark:text-green-200 mb-2">
              <span className="font-bold">💡 ملاحظة:</span> النظام سيبحث أولاً
              عن قصص موجودة تناسب كلماتك ومستواك. إذا لم يجد، سينشئ قصة جديدة.
            </p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900 rounded-lg p-4 mb-6">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <span className="font-bold">تنبيه:</span> يمكنك إنشاء قصة واحدة
              فقط في اليوم
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              الطلبات المتبقية: {remainingRequests}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300"
            >
              إنشاء القصة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const StoriesPage: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const [popularStories, setPopularStories] = useState<any[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularError, setPopularError] = useState<string | null>(null);

  // --- State for story generation ---
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genStory, setGenStory] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [remainingRequests, setRemainingRequests] = useState<{
    storyRequests: number;
    chatRequests: number;
  }>({ storyRequests: 1, chatRequests: 5 });
  const [isLoadingRemaining, setIsLoadingRemaining] = useState(false);

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

  // جلب الطلبات المتبقية
  const fetchRemainingRequests = async () => {
    setIsLoadingRemaining(true);
    try {
      const response = await getAIRemainingRequests();
      if (response.success && response.data) {
        const data = response.data as any;
        setRemainingRequests({
          storyRequests: data.storyRequests,
          chatRequests: data.chatRequests,
        });
      }
    } catch (error) {
      console.error("خطأ في جلب الطلبات المتبقية:", error);
    } finally {
      setIsLoadingRemaining(false);
    }
  };

  const handleGenerateStory = async () => {
    setGenLoading(true);
    setGenError(null);
    setGenStory(null);
    try {
      // دمج الكلمات العامة والخاصة
      const allWords = [
        ...learnedWords.public.map((w) => w.word),
        ...learnedWords.private.map((w) => w.word),
      ];

      const res = await generateStoryFromWords({
        words: allWords,
        level: getLevelString(user?.level), // هنا يتم إرسال المستوى
        language: "English",
      });

      if (res.success && res.data) {
        const storyData = res.data as any;
        setGenStory({
          title: storyData.title?.arabic || "قصة مخصصة من كلماتك",
          titleEnglish:
            storyData.title?.english || "Custom Story from Your Words",
          content: storyData.story,
          translation: storyData.translation,
          level: storyData.level,
          highlighted_words: storyData.highlighted_words,
          isExisting: storyData.isExisting || false,
        });

        // تحديث الطلبات المتبقية من الرد
        const responseData = res as any;
        if (responseData.remaining !== undefined) {
          setRemainingRequests((prev) => ({
            ...prev,
            storyRequests: responseData.remaining,
          }));
        }
      } else {
        setGenError(res.message || "لم يتم توليد القصة. حاول لاحقًا.");

        // تحديث الطلبات المتبقية فقط إذا كانت متوفرة في الرد
        const responseData = res as any;
        if (responseData.remaining !== undefined) {
          setRemainingRequests((prev) => ({
            ...prev,
            storyRequests: responseData.remaining,
          }));
        }
      }
    } catch (err: any) {
      setGenError("حدث خطأ أثناء توليد القصة. حاول مرة أخرى.");
    } finally {
      setGenLoading(false);
    }
  };

  const handleGenerateClick = () => {
    const totalWords = learnedWords.public.length + learnedWords.private.length;
    if (totalWords >= 5) {
      setShowConfirmation(true);
    }
  };

  const handleStoryClick = (story: any) => {
    navigate(`/stories/${story.id}`, { state: { story } });
  };

  const handleGeneratedStoryClick = () => {
    if (genStory) {
      // إضافة معرف مؤقت للقصة المولدة
      const storyWithId = {
        ...genStory,
        id: "generated-story",
        title: {
          arabic: genStory.title,
          english: genStory.titleEnglish || genStory.title,
        },
        titleArabic: genStory.title,
        descriptionArabic: "قصة مخصصة من كلماتك المتعلمة",
        description: "Custom story from your learned words",
        duration: "5-10 دقائق",
        image: "📚",
      };
      navigate(`/stories/generated`, { state: { story: storyWithId } });
    }
  };

  useEffect(() => {
    fetchRemainingRequests();
  }, []);

  useEffect(() => {
    fetchLearnedWords();
  }, []);

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

      {/* Story Generation Section */}
      <div className="my-8 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-indigo-900 rounded-2xl shadow-xl p-8 border border-blue-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="text-4xl">✨</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                إنشاء قصة مخصصة
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                من كلماتك التي تعلمتها
              </p>
            </div>
          </div>
          <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {isLoadingRemaining ? "..." : remainingRequests.storyRequests}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              طلبات متبقية
            </div>
          </div>
        </div>

        {/* تحقق من وجود كلمات كافية */}
        {(() => {
          const totalWords =
            learnedWords.public.length + learnedWords.private.length;

          if (wordsLoading) {
            return (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  جاري تحميل الكلمات المتعلمة...
                </div>
              </div>
            );
          }

          if (wordsError) {
            return (
              <div className="text-center bg-red-50 dark:bg-red-900 rounded-xl p-6 border border-red-200 dark:border-red-700">
                <div className="text-red-600 dark:text-red-300">
                  {wordsError}
                </div>
                <button
                  onClick={fetchLearnedWords}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  إعادة المحاولة
                </button>
              </div>
            );
          }

          if (totalWords < 5) {
            return (
              <div className="text-center bg-orange-50 dark:bg-orange-900 rounded-xl p-6 border border-orange-200 dark:border-orange-700">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
                  تحتاج إلى المزيد من الكلمات
                </h3>
                <p className="text-orange-600 dark:text-orange-300 text-sm mb-4">
                  أضف أو تعلم على الأقل 5 كلمات لتتمكن من إنشاء قصة مخصصة
                </p>
                <div className="text-xs text-orange-500 dark:text-orange-400 mb-4">
                  الكلمات المتعلمة: {totalWords}/5
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  قم بانشاء قصة من الكلمات المتعلمة ({totalWords})
                </h3>

                <button
                  onClick={handleGenerateClick}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 text-lg flex items-center justify-center gap-3 disabled:opacity-60"
                  disabled={genLoading || remainingRequests.storyRequests <= 0}
                >
                  <span>📖</span>
                  {genLoading ? "جاري التوليد..." : "إنشاء قصة مخصصة"}
                </button>
              </div>
            </div>
          );
        })()}

        {genLoading && <Loader text="جاري إنشاء قصة مخصصة..." />}
        {genError && <ErrorDisplay error={genError} />}
        {genStory && !genLoading && !genError && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">📚</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">
                      {genStory.titleEnglish}
                    </h3>
                    {genStory.titleEnglish &&
                      genStory.titleEnglish !==
                        "Custom Story from Your Words" && (
                        <p className="text-blue-100 text-sm">
                          {genStory.titleEnglish}
                        </p>
                      )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
                    {levelArabicNames[
                      genStory.level as keyof typeof levelArabicNames
                    ] || genStory.level}
                  </span>
                  {genStory.isExisting && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500 bg-opacity-20 text-green-100">
                      📖 موجودة
                    </span>
                  )}
                  {!genStory.isExisting && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500 bg-opacity-20 text-blue-100">
                      ✨ جديدة
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center justify-center gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">⏱️</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    5-10 دقائق
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">📖</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    قصة مخصصة
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    من كلماتك
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setGenStory(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-xl transition-colors"
                >
                  إغلاق
                </button>
                <button
                  onClick={handleGeneratedStoryClick}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                  قراءة القصة
                </button>
              </div>

              {genStory.isExisting && (
                <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  💡 هذه القصة موجودة مسبقاً وتم استخدامها من قبل
                </div>
              )}
              {!genStory.isExisting && (
                <div className="mt-4 text-center text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 rounded-lg p-3">
                  🎉 تم إنشاء قصة جديدة خصيصاً لك!
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={() => {
          setShowConfirmation(false);
          handleGenerateStory();
        }}
        words={[
          ...learnedWords.public.map((w) => w.word),
          ...learnedWords.private.map((w) => w.word),
        ]}
        remainingRequests={remainingRequests.storyRequests}
      />
    </div>
  );
};
