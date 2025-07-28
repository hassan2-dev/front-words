import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { apiClient } from "../../../core/utils/api";
import { useAuth } from "../../../core/providers/AuthProvider";

// Loader component
const Loader = ({ text = "جاري التحميل..." }) => (
  <div className="text-center py-8 text-lg text-gray-500 animate-pulse">
    {text}
  </div>
);

// Error display
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

// Word meaning modal
const WordMeaningModal: React.FC<{
  word: string;
  meaning: string;
  pronunciation: string;
  onClose: () => void;
  onPlayAudio: () => void;
}> = ({ word, meaning, pronunciation, onClose, onPlayAudio }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          معنى الكلمة
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
            {word}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            النطق: {pronunciation}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            المعنى:
          </div>
          <div className="text-gray-900 dark:text-gray-100">{meaning}</div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onPlayAudio}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>🔊</span>
            استمع للنطق
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  </div>
);

export const StoryReaderPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [currentWord, setCurrentWord] = useState<string>("");
  const [showWordModal, setShowWordModal] = useState(false);
  const [selectedWord, setSelectedWord] = useState<any>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(1);
  const [isAutoReading, setIsAutoReading] = useState(false);
  const [currentReadingIndex, setCurrentReadingIndex] = useState(0);

  // Get story from location state (for generated stories)
  useEffect(() => {
    if (location.state?.story) {
      setStory(location.state.story);
      setLoading(false);
    } else if (storyId && storyId !== "generated") {
      fetchStory();
    } else {
      setError("لم يتم العثور على القصة");
      setLoading(false);
    }
  }, [storyId, location.state]);

  const fetchStory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/stories/${storyId}`);
      if (res.success && res.data) {
        setStory(res.data);
      } else {
        setError("لم يتم العثور على القصة");
      }
    } catch (err) {
      setError("حدث خطأ أثناء تحميل القصة");
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const handleStartReading = () => {
    setIsReading(true);
    setReadingProgress(0);
    setCurrentReadingIndex(0);

    // Start reading timer with more realistic progress
    const timer = setInterval(() => {
      setReadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          handleCompleteStory();
          return 100;
        }
        return prev + 0.5; // Slower progress
      });
    }, 200);
  };

  const handleWordClick = (word: string) => {
    // Simulate word meaning and pronunciation
    const wordData = {
      word: word,
      meaning: `معنى كلمة "${word}" في السياق الحالي`,
      pronunciation: `[${word}]`,
      audioUrl: `https://api.dictionaryapi.dev/media/pronunciations/en/${word}.mp3`,
    };

    setSelectedWord(wordData);
    setShowWordModal(true);
  };

  const handlePlayAudio = () => {
    if (audioRef.current && selectedWord) {
      audioRef.current.src = selectedWord.audioUrl;
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleAutoRead = () => {
    setIsAutoReading(!isAutoReading);
    if (!isAutoReading) {
      // Start auto-reading
      const words = story.content.split(" ");
      let index = 0;

      const readInterval = setInterval(() => {
        if (index < words.length) {
          setCurrentWord(words[index]);
          setCurrentReadingIndex(index);
          index++;
        } else {
          clearInterval(readInterval);
          setIsAutoReading(false);
          setCurrentWord("");
        }
      }, 1000 / readingSpeed);
    }
  };

  const handleCompleteStory = async () => {
    // للقصص المولدة، لا نحتاج لإرسال طلب إكمال
    if (story?.id === "generated-story") {
      alert("🎉 مبروك! أكملت قراءة القصة المولدة!");
      return;
    }

    if (!user?.id || !story?.id) return;

    try {
      const res = await apiClient.post("/stories/complete", {
        userId: user.id,
        storyId: story.id,
        level: story.level || "L1",
        points: 10,
      });

      const data = res.data as any;
      if (data && data.achievement) {
        alert(`🎉 مبروك! حصلت على إنجاز: ${data.achievement}`);
      } else if (data && data.points) {
        alert(`👍 حصلت على ${data.points} نقطة لإكمال القصة!`);
      }
    } catch (error) {
      console.error("خطأ في إكمال القصة:", error);
    }
  };

  const renderStoryContent = (content: string) => {
    const words = content.split(" ");
    return words.map((word: string, index: number) => {
      const isCurrentWord = isAutoReading && index === currentReadingIndex;
      const isHighlighted = story.highlighted_words?.includes(word);

      return (
        <span
          key={index}
          className={`cursor-pointer transition-all duration-200 ${
            isCurrentWord
              ? "bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100 px-1 rounded"
              : isHighlighted
              ? "bg-yellow-200 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100 px-1 rounded"
              : "hover:bg-gray-100 dark:hover:bg-gray-700 px-1 rounded"
          }`}
          onClick={() => handleWordClick(word.replace(/[^\w\s]/g, ""))}
        >
          {word}
        </span>
      );
    });
  };

  if (loading) return <Loader text="جاري تحميل القصة..." />;

  if (error) return <ErrorDisplay error={error} onRetry={fetchStory} />;

  if (!story) return <ErrorDisplay error="لم يتم العثور على القصة" />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Audio element for pronunciation */}
      <audio ref={audioRef} onEnded={() => setIsPlayingAudio(false)} />

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <span className="text-xl">←</span>
              <span>العودة</span>
            </button>
            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(
                  story.level
                )}`}
              >
                {story.levelArabic || story.level}
              </span>
              {story.isCompleted && (
                <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Story Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
            <div className="flex items-start gap-4">
              <div className="text-6xl">{story.image || "📚"}</div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {story.titleArabic || story.title}
                </h1>
                <p className="text-blue-100 text-lg">
                  {story.title}
                </p>
                {story.descriptionArabic && (
                  <p className="text-blue-200 mt-3 text-sm">
                    {story.descriptionArabic}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Reading Progress */}
          {isReading && (
            <div className="bg-gray-100 dark:bg-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  تقدم القراءة
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {Math.round(readingProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${readingProgress}%` }}
                ></div>
              </div>
              {readingProgress >= 100 && (
                <div className="mt-2 text-center">
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    🎉 تم إكمال القراءة!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Story Content */}
          <div className="p-8">
            {!isReading ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-6">📖</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  جاهز للقراءة؟
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  اضغط على زر البدء لتبدأ قراءة القصة. يمكنك النقر على أي كلمة
                  لمعرفة معناها ونطقها.
                </p>
                <button
                  onClick={handleStartReading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 text-lg flex items-center gap-3 mx-auto"
                >
                  <span>🚀</span>
                  ابدأ القراءة
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Reading Controls */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleAutoRead}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          isAutoReading
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {isAutoReading
                          ? "⏸️ إيقاف القراءة"
                          : "▶️ القراءة التلقائية"}
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          السرعة:
                        </span>
                        <select
                          value={readingSpeed}
                          onChange={(e) =>
                            setReadingSpeed(Number(e.target.value))
                          }
                          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"
                        >
                          <option value={0.5}>بطيئة</option>
                          <option value={1}>عادية</option>
                          <option value={1.5}>سريعة</option>
                          <option value={2}>سريعة جداً</option>
                        </select>
                      </div>
                    </div>

                    {isAutoReading && currentWord && (
                      <div className="text-lg font-medium text-blue-600 dark:text-blue-400">
                        الكلمة الحالية: {currentWord}
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Story Text */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8">
                  <div className="prose prose-lg max-w-none text-gray-800 dark:text-gray-200 leading-relaxed">
                    {renderStoryContent(story.content)}
                  </div>
                </div>

                {/* Translation */}
                {story.translation && (
                  <div className="bg-blue-50 dark:bg-blue-900 rounded-xl p-8">
                    <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-4">
                      الترجمة العربية
                    </h3>
                    <div className="prose prose-lg max-w-none text-blue-700 dark:text-blue-300 leading-relaxed whitespace-pre-line">
                      {story.translation}
                    </div>
                  </div>
                )}

                {/* Highlighted Words */}
                {story.highlighted_words &&
                  story.highlighted_words.length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900 rounded-xl p-8">
                      <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-4">
                        الكلمات المهمة
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {story.highlighted_words.map(
                          (word: string, index: number) => (
                            <span
                              key={index}
                              className="bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:bg-yellow-300 dark:hover:bg-yellow-600 transition-colors"
                              onClick={() => handleWordClick(word)}
                            >
                              {word}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Story Actions */}
                <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setIsReading(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-3 px-6 rounded-xl transition-colors"
                  >
                    إعادة القراءة
                  </button>
                  <button
                    onClick={handleCompleteStory}
                    disabled={readingProgress < 100}
                    className={`flex-1 font-medium py-3 px-6 rounded-xl transition-colors ${
                      readingProgress >= 100
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-gray-400 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    أنهيت القصة 🎉
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Story Stats */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            معلومات القصة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {story.duration || "5-10"}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                دقائق للقراءة
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {story.levelArabic || story.level}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                مستوى الصعوبة
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {story.isCompleted ? "مكتملة" : "غير مكتملة"}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                حالة القصة
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Word Meaning Modal */}
      {showWordModal && selectedWord && (
        <WordMeaningModal
          word={selectedWord.word}
          meaning={selectedWord.meaning}
          pronunciation={selectedWord.pronunciation}
          onClose={() => setShowWordModal(false)}
          onPlayAudio={handlePlayAudio}
        />
      )}
    </div>
  );
};
