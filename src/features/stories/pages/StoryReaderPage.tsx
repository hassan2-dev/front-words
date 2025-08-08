import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Play,
  Pause,
  BookOpen,
  GraduationCap,
  Check,
  X,
  HelpCircle,
  Mic,
  ArrowLeft,
  Home,
  Sparkles,
  Star,
  Brain,
  Target,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import type { DailyStory, DailyStoryWord } from "@/core/types";
import { enhanceStory, enhanceWords } from "@/core/utils/storyEnhancer";
import {
  apiClient,
  checkDailyStory,
  requestDailyStory,
  getDailyStoryWordStatistics,
  getDailyStoryRemaining,
  updateWordStatus,
  completeDailyStory,
} from "@/core/utils/api";

interface StoryReaderProps {
  story?: DailyStory;
  onComplete?: () => void;
  onClose?: () => void;
}

export const StoryReaderPage: React.FC<StoryReaderProps> = ({
  story: propStory,
  onComplete,
  onClose,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [currentStory, setCurrentStory] = useState<DailyStory | null>(
    propStory || null
  );
  const [selectedWord, setSelectedWord] = useState<DailyStoryWord | null>(null);
  const [showWordModal, setShowWordModal] = useState(false);
  const [wordStatus, setWordStatus] = useState<
    Record<string, "KNOWN" | "PARTIALLY_KNOWN" | "NOT_LEARNED">
  >({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [wordsLearned, setWordsLearned] = useState(0);
  const [notifications, setNotifications] = useState<
    Array<{ id: string; message: string; type: "success" | "error" | "info" }>
  >([]);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [wordInteractionCount, setWordInteractionCount] = useState<
    Record<string, number>
  >({});
  const [readingTime, setReadingTime] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wordStatistics, setWordStatistics] = useState({
    totalWords: 0,
    knownWords: 0,
    partiallyKnownWords: 0,
    unknownWords: 0,
    progressPercentage: 0,
  });
  const [remainingRequests, setRemainingRequests] = useState(0);

  // Load story from location if not provided
  useEffect(() => {
    if (!currentStory && location.state?.story) {
      // Check if story is valid before enhancing
      if (!location.state.story || typeof location.state.story !== "object") {
        console.error(
          "Invalid story object in location state:",
          location.state.story
        );
        setError("قصة غير صحيحة. يرجى المحاولة مرة أخرى.");
        return;
      }

      try {
        // استخدام القصة الأصلية بدون إضافة محتوى
        const originalStory = {
          ...location.state.story,
          words: location.state.story.words || [],
        };
        setCurrentStory(originalStory as DailyStory);
      } catch (error) {
        console.error("Error loading story:", error);
        setError("حدث خطأ في تحميل القصة. يرجى المحاولة مرة أخرى.");
      }
    }
  }, [location.state, currentStory]);

  // جلب إحصائيات الكلمات
  const fetchWordStatistics = async () => {
    try {
      const response = await getDailyStoryWordStatistics();
      if (response.success && response.data) {
        const stats = response.data as any;
        setWordStatistics({
          totalWords: stats.totalWords || 0,
          knownWords: stats.knownWords || 0,
          partiallyKnownWords: stats.partiallyKnownWords || 0,
          unknownWords: stats.unknownWords || 0,
          progressPercentage: stats.progressPercentage || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching word statistics:", error);
    }
  };

  // جلب الطلبات المتبقية
  const fetchRemainingRequests = async () => {
    try {
      const response = await getDailyStoryRemaining();
      if (response.success && response.data) {
        const data = response.data as any;
        setRemainingRequests(data.remaining || 0);
      }
    } catch (error) {
      console.error("Error fetching remaining requests:", error);
    }
  };

  // Initialize word statuses and fetch all words
  useEffect(() => {
    if (currentStory?.words && currentStory.words.length > 0) {
      const initialStatus: Record<
        string,
        "KNOWN" | "PARTIALLY_KNOWN" | "NOT_LEARNED"
      > = {};
      let knownCount = 0;
      currentStory.words.forEach((word) => {
        const status =
          (word.status as "KNOWN" | "PARTIALLY_KNOWN" | "NOT_LEARNED") ||
          "NOT_LEARNED";
        initialStatus[word.word] = status;
        if (status === "KNOWN") knownCount++;
      });
      setWordStatus(initialStatus);
      setWordsLearned(knownCount);
      setReadingProgress(
        (knownCount / (currentStory?.words?.length || 1)) * 100
      );

      // جلب الطلبات المتبقية
      fetchRemainingRequests();
    }
  }, [currentStory]);

  // Reading time tracker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentStory) {
      interval = setInterval(() => {
        setReadingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStory]);

  // Speech synthesis
  const speakText = (text: string, lang: string = "en-US") => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };
  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Word interaction
  const handleWordClick = async (word: DailyStoryWord) => {
    console.log("Word clicked:", word);
    setSelectedWord(word);
    setShowWordModal(true);
    speakText(word.word, "en-US");
    setWordInteractionCount((prev) => ({
      ...prev,
      [word.word]: (prev[word.word] || 0) + 1,
    }));
  };

  // Word status change
  const handleWordStatusChange = async (
    word: string,
    status: "KNOWN" | "PARTIALLY_KNOWN" | "NOT_LEARNED"
  ) => {
    setWordStatus((prev) => {
      const newStatus = { ...prev, [word]: status };
      const knownCount = Object.values(newStatus).filter(
        (s) => s === "KNOWN"
      ).length;
      setWordsLearned(knownCount);
      setReadingProgress(
        (knownCount / (currentStory?.words.length || 1)) * 100
      );
      return newStatus;
    });

    try {
      if (!currentStory?.id) {
        console.error("No story ID available");
        addNotification("خطأ: لا يوجد معرف للقصة", "error");
        return;
      }

      if (!word || word.trim() === "") {
        console.error("Invalid word");
        addNotification("خطأ: كلمة غير صحيحة", "error");
        return;
      }

      console.log("Sending word interaction:", {
        word: word,
        status: status,
        storyId: currentStory.id,
      });

      const response = await updateWordStatus({
        word: word,
        status: status,
      });

      console.log("Word interaction response:", response);

      if (response.success) {
        addNotification("تم تحديث حالة الكلمة بنجاح", "success");
        // تحديث الإحصائيات بعد تغيير حالة الكلمة
        fetchWordStatistics();
      } else {
        addNotification("خطأ في تحديث حالة الكلمة", "error");
      }
    } catch (error) {
      console.error("Error updating word status:", error);
      addNotification("خطأ في تحديث حالة الكلمة", "error");
    }
    setShowWordModal(false);
  };

  // Word coloring based on status
  const getWordColor = (word: DailyStoryWord) => {
    const status = wordStatus[word.word] || word.status;

    // Return only text color classes without backgrounds
    switch (status) {
      case "KNOWN":
        return "text-green-600 dark:text-green-400 cursor-pointer hover:underline";
      case "PARTIALLY_KNOWN":
        return "text-yellow-600 dark:text-yellow-400 cursor-pointer hover:underline";
      case "NOT_LEARNED":
        return "text-gray-800 dark:text-gray-200 cursor-pointer hover:underline";
      default:
        return "text-gray-800 dark:text-gray-200 cursor-pointer hover:underline";
    }
  };

  // Complete story
  const handleCompleteStory = async () => {
    try {
      const response = await completeDailyStory({
        storyId: currentStory?.id || "",
        level: "beginner",
        points: wordsLearned * 10,
      });

      if (response.success) {
        setShowCompletionModal(true);
        addNotification("🎉 تم إكمال القصة بنجاح!", "success");
        if (onComplete) onComplete();
      } else {
        addNotification("خطأ في إكمال القصة", "error");
      }
    } catch (error) {
      addNotification("خطأ في إكمال القصة", "error");
    }
  };

  // Add notification
  const addNotification = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (!currentStory) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            لا توجد قصة متاحة
          </h2>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            العودة للقصص
          </button>
        </div>
      </div>
    );
  }

  // Render clickable words in content
  const renderContent = (content: string) => {
    const words = content.split(/(\s+)/);
    return words.map((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:"*]/g, "");
      const storyWord = currentStory.words.find(
        (w) =>
          w.word.toLowerCase() === cleanWord ||
          w.word.toLowerCase().includes(cleanWord) ||
          cleanWord.includes(w.word.toLowerCase())
      );

      // جعل كل كلمة قابلة للضغط
      if (word.trim()) {
        return (
          <span
            key={index}
            onClick={() => {
              if (storyWord) {
                handleWordClick(storyWord);
              } else {
                // إنشاء كلمة مؤقتة للكلمات غير الموجودة في القائمة
                const tempWord: DailyStoryWord = {
                  word: cleanWord,
                  meaning: cleanWord,
                  sentence: `"${word}"`,
                  sentenceAr: `"${word}"`,
                  sentence_ar: `"${word}"`,
                  status: "NOT_LEARNED",
                  type: "unknown",
                  color: "blue",
                  isDailyWord: false,
                };
                handleWordClick(tempWord);
              }
            }}
            className={`${
              storyWord
                ? getWordColor(storyWord)
                : "text-gray-800 dark:text-gray-200 cursor-pointer hover:underline"
            }`}
            title={`انقر لمعرفة المزيد عن "${cleanWord}"`}
          >
            {word}
          </span>
        );
      }
      return <span key={index}>{word}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/stories")}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {currentStory?.title
                    ? currentStory.title.split(" - ")[0]
                    : "القصة"}
                </h1>
              </div>
              <div></div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => speakText(currentStory?.content || "")}
                className={`p-2 rounded-lg transition-colors ${
                  isSpeaking
                    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                }`}
                title="استمع للقصة"
              >
                {isSpeaking ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={handleCompleteStory}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                إنهاء القصة
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Story Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="max-w-none">
              <div className="text-gray-800 dark:text-gray-200 leading-relaxed text-xl font-normal text-justify">
                {renderContent(currentStory?.content || "")}
              </div>
            </div>
          </div>
          {/* Translation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                  ع
                </span>
                الترجمة العربية
              </h3>
              <button
                onClick={() =>
                  speakText(currentStory?.translation || "", "ar-SA")
                }
                className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg text-right text-justify">
              {currentStory?.translation || ""}
            </div>
          </div>
          {/* Learning Progress */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              إحصائيات التعلم
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {wordStatistics.knownWords ||
                    Object.values(wordStatus).filter((s) => s === "KNOWN")
                      .length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  معروفة
                </div>
              </div>
              <div className="text-center p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {wordStatistics.partiallyKnownWords ||
                    Object.values(wordStatus).filter(
                      (s) => s === "PARTIALLY_KNOWN"
                    ).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  جزئية
                </div>
              </div>
              <div className="text-center p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {wordStatistics.unknownWords ||
                    Object.values(wordStatus).filter((s) => s === "NOT_LEARNED")
                      .length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  جديدة
                </div>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>التقدم</span>
                <span>
                  {wordStatistics.progressPercentage ||
                    Math.round(
                      (wordsLearned / currentStory.words.length) * 100
                    )}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      wordStatistics.progressPercentage ||
                      Math.round(
                        (wordsLearned / currentStory.words.length) * 100
                      )
                    }%`,
                  }}
                ></div>
              </div>
            </div>
            {/* Remaining Requests */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                الطلبات المتبقية: {remainingRequests}
              </p>
            </div>
          </div>
        </div>
      </main>
      {/* Word Modal */}
      {showWordModal && selectedWord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-lg w-full">
            <div className="text-center">
              {selectedWord.isDailyWord && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm mb-4">
                  <Star className="w-3 h-3" />
                  كلمة يومية
                </div>
              )}
              <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                {selectedWord.word}
              </h3>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
                {selectedWord.meaning}
              </p>
              {selectedWord.sentence && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                  <p className="text-gray-800 dark:text-gray-200 mb-3 text-lg">
                    "{selectedWord.sentence}"
                  </p>
                  {selectedWord.sentence_ar && (
                    <p className="text-gray-600 dark:text-gray-400 text-base text-right">
                      "{selectedWord.sentence_ar}"
                    </p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  onClick={() =>
                    handleWordStatusChange(selectedWord.word, "KNOWN")
                  }
                  className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  أعرفها
                </button>
                <button
                  onClick={() =>
                    handleWordStatusChange(selectedWord.word, "PARTIALLY_KNOWN")
                  }
                  className="px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  جزئياً
                </button>
                <button
                  onClick={() =>
                    handleWordStatusChange(selectedWord.word, "NOT_LEARNED")
                  }
                  className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  لا أعرف
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => speakText(selectedWord.word)}
                  className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Mic className="w-5 h-5" />
                  استمع
                </button>
                <button
                  onClick={() => setShowWordModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              🎉 مبروك!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              لقد أكملت قراءة القصة بنجاح وتعلمت {wordsLearned} كلمة جديدة!
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {wordsLearned}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  كلمات معروفة
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(
                    (wordsLearned / (currentStory?.words?.length || 1)) * 100
                  )}
                  %
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  نسبة الإتمام
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/stories")}
                className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                القصص
              </button>
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  navigate("/story-exam", { state: { story: currentStory } });
                }}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                اختبار
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`max-w-sm p-4 rounded-lg shadow-lg border transition-all duration-300 ${
              notification.type === "success"
                ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200"
                : notification.type === "error"
                ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200"
                : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{notification.message}</p>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
