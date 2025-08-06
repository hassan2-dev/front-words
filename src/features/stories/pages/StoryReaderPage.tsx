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
  Settings,
  Star,
  Copy,
  Target,
  Brain,
  Award,
  Clock,
} from "lucide-react";
import type { DailyStory, DailyStoryWord } from "@/core/types";
import { enhanceStory, enhanceWords } from "@/core/utils/storyEnhancer";
import { apiClient, getAllDailyStoryWords } from "@/core/utils/api";

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
        const enhancedStory = {
          ...location.state.story,
          ...enhanceStory(location.state.story),
          words: enhanceWords(location.state.story.words || []),
        };
        setCurrentStory(enhancedStory as DailyStory);
      } catch (error) {
        console.error("Error enhancing story:", error);
        setError("حدث خطأ في تحميل القصة. يرجى المحاولة مرة أخرى.");
      }
    }
  }, [location.state, currentStory]);

  // جلب كل الكلمات من القصة اليومية
  const fetchAllStoryWords = async () => {
    try {
      const response = await getAllDailyStoryWords();
      if (response.success && response.data) {
        console.log("All story words:", response.data);
        // يمكن استخدام البيانات هنا إذا لزم الأمر
      }
    } catch (error) {
      console.error("Error fetching all story words:", error);
    }
  };

  // Initialize word statuses
  useEffect(() => {
    if (currentStory?.words) {
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
      setReadingProgress((knownCount / currentStory.words.length) * 100);
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
      await apiClient.post("/stories/daily/story/word-interaction", {
        word: word,
        status: status,
        storyId: currentStory?.id,
      });
      addNotification("تم تحديث حالة الكلمة بنجاح", "success");
    } catch (error) {
      addNotification("خطأ في تحديث حالة الكلمة", "error");
    }
    setShowWordModal(false);
  };

  // Word coloring based on status
  const getWordColor = (word: DailyStoryWord) => {
    const status = wordStatus[word.word] || word.status;
    let baseClasses =
      "inline-block px-2 py-1 mx-0.5 my-0.5 rounded-lg cursor-pointer transition-all duration-300 hover:scale-110 font-semibold text-sm border-2 shadow-sm ";
    if (word.isDailyWord) {
      baseClasses +=
        "ring-2 ring-blue-400 ring-opacity-50 shadow-blue-200 dark:shadow-blue-900/30 ";
    }
    switch (status) {
      case "KNOWN":
        return (
          baseClasses +
          "text-emerald-800 bg-gradient-to-r from-emerald-200 to-emerald-100 dark:from-emerald-800/50 dark:to-emerald-700/30 dark:text-emerald-200 border-emerald-400 dark:border-emerald-600 hover:from-emerald-300 hover:to-emerald-200 shadow-emerald-200 hover:shadow-emerald-300"
        );
      case "PARTIALLY_KNOWN":
        return (
          baseClasses +
          "text-amber-800 bg-gradient-to-r from-amber-200 to-amber-100 dark:from-amber-800/50 dark:to-amber-700/30 dark:text-amber-200 border-amber-400 dark:border-amber-600 hover:from-amber-300 hover:to-amber-200 shadow-amber-200"
        );
      case "NOT_LEARNED":
        return (
          baseClasses +
          "text-rose-800 bg-gradient-to-r from-rose-200 to-rose-100 dark:from-rose-800/50 dark:to-rose-700/30 dark:text-rose-200 border-rose-400 dark:border-rose-600 hover:from-rose-300 hover:to-rose-200 shadow-rose-200"
        );
      default:
        return (
          baseClasses +
          "text-blue-800 bg-gradient-to-r from-blue-200 to-blue-100 dark:from-blue-800/50 dark:to-blue-700/30 dark:text-blue-200 border-blue-400 dark:border-blue-600 hover:from-blue-300 hover:to-blue-200 shadow-blue-200"
        );
    }
  };

  // Complete story
  const handleCompleteStory = async () => {
    try {
      await apiClient.post("/stories/daily/story/complete", {
        storyId: currentStory?.id,
        completedAt: new Date().toISOString(),
      });
      setShowCompletionModal(true);
      addNotification("🎉 تم إكمال القصة بنجاح!", "success");
      if (onComplete) onComplete();
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
                  meaning: "لم يتم العثور على المعنى",
                  sentence: `"${word}"`,
                  sentenceAr: `"${word}"`,
                  sentence_ar: `"${word}"`,
                  status: "NOT_LEARNED",
                  type: "unknown",
                  color: "red",
                  isDailyWord: false,
                };
                handleWordClick(tempWord);
              }
            }}
            className={`inline-block px-1 py-0.5 mx-0.5 my-0.5 rounded cursor-pointer transition-all duration-200 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:scale-105 ${
              storyWord
                ? getWordColor(storyWord)
                : "text-gray-800 dark:text-gray-200"
            }`}
            title={
              storyWord
                ? `${storyWord.meaning} - انقر للتفاصيل`
                : `انقر لمعرفة المزيد عن "${cleanWord}"`
            }
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
              <button
                onClick={() => navigate("/stories")}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {currentStory.title.split(" - ")[0]}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentStory.words.length} كلمة • {wordsLearned} كلمة معروفة
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => speakText(currentStory.content)}
                className={`p-2 rounded-lg transition-colors ${
                  isSpeaking
                    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                }`}
              >
                {isSpeaking ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={fetchAllStoryWords}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mr-2"
              >
                <Target className="w-4 h-4" />
                جلب كل الكلمات
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div className="text-gray-800 dark:text-gray-200 leading-relaxed text-lg">
                {renderContent(currentStory.content)}
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
                onClick={() => speakText(currentStory.translation, "ar-SA")}
                className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg text-right">
              {currentStory.translation}
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
                  {
                    Object.values(wordStatus).filter((s) => s === "KNOWN")
                      .length
                  }
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  معروفة
                </div>
              </div>
              <div className="text-center p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {
                    Object.values(wordStatus).filter(
                      (s) => s === "PARTIALLY_KNOWN"
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  جزئية
                </div>
              </div>
              <div className="text-center p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {
                    Object.values(wordStatus).filter((s) => s === "NOT_LEARNED")
                      .length
                  }
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  جديدة
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Word Modal */}
      {showWordModal && selectedWord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full">
            <div className="text-center">
              {selectedWord.isDailyWord && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm mb-4">
                  <Star className="w-3 h-3" />
                  كلمة يومية
                </div>
              )}
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {selectedWord.word}
              </h3>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                {selectedWord.meaning}
              </p>
              {selectedWord.sentence && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <p className="text-gray-800 dark:text-gray-200 mb-2">
                    "{selectedWord.sentence}"
                  </p>
                  {selectedWord.sentence_ar && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm text-right">
                      "{selectedWord.sentence_ar}"
                    </p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() =>
                    handleWordStatusChange(selectedWord.word, "KNOWN")
                  }
                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center justify-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  أعرفها
                </button>
                <button
                  onClick={() =>
                    handleWordStatusChange(selectedWord.word, "PARTIALLY_KNOWN")
                  }
                  className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm flex items-center justify-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  جزئياً
                </button>
                <button
                  onClick={() =>
                    handleWordStatusChange(selectedWord.word, "NOT_LEARNED")
                  }
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center justify-center gap-1"
                >
                  <X className="w-3 h-3" />
                  لا أعرف
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => speakText(selectedWord.word)}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  استمع
                </button>
                <button
                  onClick={() => setShowWordModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
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
                  {Math.round((wordsLearned / currentStory.words.length) * 100)}
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
