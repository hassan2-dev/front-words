/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * StoryReaderPage - صفحة قراءة القصص اليومية
 * نظام الألوان: أزرق (كلمات اليوم) | أخضر (معروفة) | أصفر (جزئية) | أحمر (غير معروفة)
 */

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
  Clock,
  BarChart3,
  Volume2,
  VolumeX,
  Award,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { DailyStory, DailyStoryWord } from "@/core/types";
import { enhanceStory } from "@/core/utils/storyEnhancer";
import {
  apiClient,
  checkDailyStory,
  requestDailyStory,
  getDailyStoryWordStatistics,
  getDailyStoryRemaining,
  updateWordStatus,
  completeDailyStory,
} from "@/core/utils/api";
import { Loading } from "@/presentation/components";
import { useAuth } from "@/core/providers/AuthProvider";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface StoryReaderProps {
  story?: DailyStory;
  onComplete?: () => void;
  onClose?: () => void;
}

type WordStatus = "KNOWN" | "PARTIALLY_KNOWN" | "UNKNOWN" | "NOT_LEARNED";
type NotificationType = "success" | "error" | "info";

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const StoryReaderPage: React.FC<StoryReaderProps> = ({
  story: propStory,
  onComplete,
  onClose,
}) => {
  // ============================================================================
  // HOOKS & CONTEXT
  // ============================================================================
  const location = useLocation();
  const navigate = useNavigate();
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { user } = useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Story State
  const [currentStory, setCurrentStory] = useState<DailyStory | null>(
    propStory || null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Word Interaction State
  const [selectedWord, setSelectedWord] = useState<DailyStoryWord | null>(null);
  const [showWordModal, setShowWordModal] = useState(false);
  const [wordStatus, setWordStatus] = useState<Record<string, WordStatus>>({});
  const [wordInteractionCount, setWordInteractionCount] = useState<
    Record<string, number>
  >({});

  // Daily Words Modal State
  const [showDailyWordsModal, setShowDailyWordsModal] = useState(false);
  const [dailyWordsCompleted, setDailyWordsCompleted] = useState(false);

  // Progress & Statistics State
  const [wordsLearned, setWordsLearned] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [wordStatistics, setWordStatistics] = useState({
    totalWords: 0,
    knownWords: 0,
    partiallyKnownWords: 0,
    unknownWords: 0,
    progressPercentage: 0,
  });
  const [remainingRequests, setRemainingRequests] = useState(0);

  // UI State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [modalCountdown, setModalCountdown] = useState(10);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  // Clean duplicate words from story
  const cleanDuplicateWords = (words: DailyStoryWord[]) => {
    const uniqueWords = new Map();

    words.forEach((word) => {
      const key = word.word.toLowerCase();
      const existingWord = uniqueWords.get(key);

      if (
        !existingWord ||
        (word.status !== "UNKNOWN" && existingWord.status === "UNKNOWN") ||
        (word.status === "KNOWN" && existingWord.status !== "KNOWN")
      ) {
        uniqueWords.set(key, {
          word: word.word || "",
          meaning: word.meaning || "",
          sentence: word.sentence || "",
          sentence_ar: word.sentence_ar || word.sentenceAr || "",
          status: word.status || "NOT_LEARNED",
          type: word.type || "NOT_LEARNED",
          isDailyWord: word.isDailyWord || word.type === "daily" || false,
          canInteract: word.canInteract !== false,
          isClickable: word.isClickable !== false,
          hasDefinition: word.hasDefinition !== false,
          hasSentence: word.hasSentence !== false,
          color: word.color || "black",
        });
      }
    });

    return Array.from(uniqueWords.values());
  };

  // Format reading time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // دالة لإعادة تعيين حالة البوب
  const resetModalState = () => {
    const today = new Date().toISOString().split("T")[0];

    // مسح البيانات المحفوظة لليوم الحالي فقط
    localStorage.removeItem("dailyWordsModalShownDate");
    localStorage.removeItem("dailyWordsCompletedDate");

    // إعادة تعيين الحالة
    setShowDailyWordsModal(true);
    setDailyWordsCompleted(false);

    console.log("Modal state reset for today:", today);
  };

  // دالة للتحقق من بداية يوم جديد وإعادة تعيين الحالة
  const checkAndResetForNewDay = () => {
    const today = new Date().toISOString().split("T")[0];
    const lastShownDate = localStorage.getItem("dailyWordsModalShownDate");
    const lastCompletedDate = localStorage.getItem("dailyWordsCompletedDate");

    // التحقق من صحة التواريخ المحفوظة
    const isValidDate = (dateStr: string | null) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return !isNaN(date.getTime()) && date <= new Date();
    };

    // إذا كان التاريخ غير صحيح أو في المستقبل، نعيد تعيين الحالة
    if (!isValidDate(lastShownDate) || !isValidDate(lastCompletedDate)) {
      localStorage.removeItem("dailyWordsModalShownDate");
      localStorage.removeItem("dailyWordsCompletedDate");
      console.log("Invalid date detected, modal state reset for:", today);
      return;
    }

    // إذا كان اليوم مختلف عن آخر مرة تم فيها عرض البوب، نعيد تعيين الحالة
    if (lastShownDate !== today && lastCompletedDate !== today) {
      localStorage.removeItem("dailyWordsModalShownDate");
      localStorage.removeItem("dailyWordsCompletedDate");
      console.log("New day detected, modal state reset for:", today);
    }

    // دائماً نعيد تعيين الحالة عند بداية يوم جديد
    if (lastShownDate !== today) {
      localStorage.removeItem("dailyWordsModalShownDate");
      console.log("Modal will be shown for new day:", today);
    }
  };

  // دالة لمسح localStorage بالكامل وإعادة تعيين الحالة
  const clearAllModalData = () => {
    localStorage.removeItem("dailyWordsModalShownDate");
    localStorage.removeItem("dailyWordsCompletedDate");
    localStorage.removeItem("dailyWordsModalShown");
    localStorage.removeItem("dailyWordsModalLastShown");
    localStorage.removeItem("dailyWordsCompleted");

    // إعادة تعيين الحالة
    setShowDailyWordsModal(true);
    setDailyWordsCompleted(false);

    console.log("All modal data cleared and state reset");
  };

  // دالة لإعادة تعيين البوب للاختبار
  const resetModalForTesting = () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.removeItem("dailyWordsModalShownDate");
    localStorage.removeItem("dailyWordsCompletedDate");

    setShowDailyWordsModal(true);
    setDailyWordsCompleted(false);

    console.log("Modal reset for testing on:", today);
    addNotification("تم إعادة تعيين البوب للاختبار", "success");
  };

  // دالة لاختبار النظام وإعادة تعيين الحالة
  const testAndResetSystem = () => {
    const today = new Date().toISOString().split("T")[0];

    // مسح جميع البيانات
    clearAllModalData();

    // إعادة تعيين الحالة لليوم الحالي
    setShowDailyWordsModal(true);
    setDailyWordsCompleted(false);

    console.log("System reset for today:", today);
    addNotification("تم إعادة تعيين النظام بنجاح", "success");
  };

  // ============================================================================
  // API FUNCTIONS
  // ============================================================================

  // Fetch word statistics
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

  // Fetch remaining requests
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

  // ============================================================================
  // SPEECH SYNTHESIS
  // ============================================================================

  // Speak text with speech synthesis
  const speakText = (text: string, lang: string = "en-US") => {
    if (!text || text.trim() === "") {
      addNotification("لا يوجد نص للقراءة", "error");
      return;
    }

    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new window.SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          setTimeout(() => fetchRemainingRequests(), 500);
        };
        utterance.onerror = () => setIsSpeaking(false);

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const preferredVoice =
            voices.find((voice) => voice.lang.startsWith(lang.split("-")[0])) ||
            voices[0];
          utterance.voice = preferredVoice;
        }

        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        setIsSpeaking(false);
        addNotification("خطأ في تشغيل الصوت", "error");
      }
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } catch (error) {
        console.error("Error stopping speech:", error);
      }
    }
  };

  // ============================================================================
  // WORD INTERACTION HANDLERS
  // ============================================================================

  // Handle word click
  const handleWordClick = async (word: DailyStoryWord) => {
    setSelectedWord(word);
    setShowWordModal(true);
    speakText(word.word, "en-US");
    setWordInteractionCount((prev) => ({
      ...prev,
      [word.word]: (prev[word.word] || 0) + 1,
    }));
  };

  // Handle word status change
  const handleWordStatusChange = async (word: string, status: WordStatus) => {
    setShowWordModal(false);

    setWordStatus((prev) => {
      const newStatus = { ...prev, [word]: status };
      const knownCount = Object.values(newStatus).filter(
        (s) => s === "KNOWN"
      ).length;
      setWordsLearned(knownCount);
      setReadingProgress(
        (knownCount / (currentStory?.words.length || 1)) * 100
      );

      const dailyWords =
        currentStory?.words?.filter(
          (w) => w.isDailyWord || w.type === "daily"
        ) || [];

      // إذا لم تكن هناك كلمات يومية محددة، استخدم أول 7 كلمات
      const wordsToCheck =
        dailyWords.length > 0
          ? dailyWords
          : currentStory?.words?.slice(0, 7) || [];

      const completedDailyWords = wordsToCheck.filter(
        (word) => newStatus[word.word] && newStatus[word.word] !== "NOT_LEARNED"
      );

      // تحقق من إكمال الكلمات اليومية (يجب أن تكون 7 كلمات على الأقل)
      if (completedDailyWords.length >= 7 && wordsToCheck.length > 0) {
        setDailyWordsCompleted(true);
        setShowDailyWordsModal(false);

        // حفظ حالة إكمال الكلمات اليوم في localStorage
        const today = new Date().toISOString().split("T")[0];
        localStorage.setItem("dailyWordsCompletedDate", today);

        // لا نغلق البوب تلقائياً، نترك المستخدم يغلقه يدوياً
        addNotification(
          "🎉 تم إكمال جميع الكلمات اليومية! يمكنك الآن قراءة القصة",
          "success"
        );
      }

      return newStatus;
    });

    try {
      if (!currentStory?.id || !word || word.trim() === "") return;

      const response = await updateWordStatus({ word, status });
      if (response.success) {
        addNotification("تم تحديث حالة الكلمة بنجاح", "success");
      } else {
        addNotification("خطأ في تحديث حالة الكلمة", "error");
      }
    } catch (error) {
      addNotification("خطأ في تحديث حالة الكلمة", "error");
    }
  };

  // Complete story
  const handleCompleteStory = async () => {
    const dailyWords =
      currentStory?.words?.filter((w) => w.isDailyWord || w.type === "daily") ||
      [];

    // إذا لم تكن هناك كلمات يومية محددة، استخدم أول 7 كلمات
    const wordsToCheck =
      dailyWords.length > 0
        ? dailyWords
        : currentStory?.words?.slice(0, 7) || [];

    const interactedDailyWords = wordsToCheck.filter(
      (word) => wordStatus[word.word] && wordStatus[word.word] !== "NOT_LEARNED"
    );

    if (interactedDailyWords.length < wordsToCheck.length) {
      const remainingWords = wordsToCheck.length - interactedDailyWords.length;
      addNotification(
        `يجب عليك التفاعل مع جميع الكلمات اليومية أولاً (${remainingWords} كلمة متبقية)`,
        "error"
      );
      return;
    }

    try {
      const response = await completeDailyStory({
        storyId: currentStory?.id || "",
        level: (user?.level as unknown as string) || "L1",
        points: wordsLearned * 10,
      });

      if (response.success) {
        setShowCompletionModal(true);
        addNotification("🎉 تم إكمال القصة بنجاح!", "success");
        localStorage.setItem("dailyStoryCompleted", "true");
        if (onComplete) onComplete();
      } else {
        addNotification("خطأ في إكمال القصة", "error");
      }
    } catch (error) {
      addNotification("خطأ في إكمال القصة", "error");
    }
  };

  // ============================================================================
  // NOTIFICATION HANDLERS
  // ============================================================================

  // Add notification
  const addNotification = (
    message: string,
    type: NotificationType = "info"
  ) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // ============================================================================
  // STYLING FUNCTIONS
  // ============================================================================

  // Get word color based on status
  const getWordColor = (word: DailyStoryWord) => {
    const status = wordStatus[word.word] || word.status || "NOT_LEARNED";
    const isDailyWord = word.isDailyWord || false;

    const colorMap = {
      KNOWN:
        "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300",
      PARTIALLY_KNOWN:
        "text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300",
      UNKNOWN:
        "text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300",
      NOT_LEARNED: isDailyWord
        ? "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        : "text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300",
    };

    return `${colorMap[status]} cursor-pointer transition-all duration-200 hover:underline hover:scale-105 font-medium px-1 py-0.5 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800`;
  };

  // ============================================================================
  // CONTENT RENDERING
  // ============================================================================

  // Render content with interactive words
  const renderContent = (content: string) => {
    const words = content.split(/(\s+)/);

    return words.map((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:"*()[\]]/g, "");

      if (!cleanWord.trim()) {
        return <span key={index}>{word}</span>;
      }

      let storyWord = currentStory?.words.find(
        (w) => w.word.toLowerCase() === cleanWord
      );

      if (!storyWord) {
        storyWord = currentStory?.words.find((w) => {
          const wordLower = w.word.toLowerCase();
          const cleanWordLower = cleanWord.toLowerCase();

          if (wordLower.length <= 3 || cleanWordLower.length <= 3) {
            return wordLower === cleanWordLower;
          }

          if (wordLower.length >= 4 && cleanWordLower.length >= 4) {
            return (
              (wordLower.includes(cleanWordLower) &&
                Math.abs(wordLower.length - cleanWordLower.length) <= 2) ||
              (cleanWordLower.includes(wordLower) &&
                Math.abs(wordLower.length - cleanWordLower.length) <= 2)
            );
          }

          return false;
        });
      }

      if (word.trim()) {
        return (
          <span
            key={index}
            onClick={() => {
              if (storyWord && storyWord.canInteract !== false) {
                handleWordClick(storyWord);
              } else if (!storyWord) {
                // إنشاء كلمة مؤقتة
                const tempWord: DailyStoryWord = {
                  word: cleanWord,
                  meaning: "",
                  sentence: "",
                  sentenceAr: "",
                  sentence_ar: "",
                  status: "NOT_LEARNED",
                  type: "NOT_LEARNED",
                  color: "black",
                  isDailyWord: false,
                  canInteract: true,
                  isClickable: true,
                  hasDefinition: true,
                  hasSentence: true,
                };
                handleWordClick(tempWord);
              }
              setTimeout(() => fetchWordStatistics(), 1500);
            }}
            className={
              storyWord
                ? getWordColor(storyWord)
                : "text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:underline hover:scale-105 px-1 py-0.5 rounded-sm hover:bg-blue-50 dark:hover:bg-blue-900/20"
            }
            title={`انقر لمعرفة المزيد عن "${cleanWord}"`}
          >
            {word}
          </span>
        );
      }
      return <span key={index}>{word}</span>;
    });
  };

  // Loading screen
  if (isLoading) {
    return <Loading isOverlay text="جاري تحميل القصة..." size="sm" />;
  }

  // تحسين useEffect لتحميل القصة
  useEffect(() => {
    // التحقق من بداية يوم جديد أولاً
    checkAndResetForNewDay();

    if (!currentStory && location.state?.story) {
      try {
        // التحقق من صحة البيانات قبل التحميل
        const storyData = location.state.story;

        if (
          !storyData.content ||
          !storyData.words ||
          storyData.words.length === 0
        ) {
          console.error("Invalid story data received:", storyData);
          setError("بيانات القصة غير صحيحة. يرجى العودة للصفحة السابقة.");
          return;
        }

        // تنظيف الكلمات
        const cleanedWords = cleanDuplicateWords(storyData.words || []);

        const originalStory = {
          ...storyData,
          id: storyData.id || `story-${Date.now()}`,
          title: storyData.title || "قصة اليوم",
          content: storyData.content || "",
          translation: storyData.translation || "",
          words: cleanedWords,
          totalWords: storyData.totalWords || storyData.words?.length || 0,
          dailyWordsCount: storyData.dailyWordsCount || 0,
          complementaryWordsCount: storyData.complementaryWordsCount || 0,
          date: storyData.date || new Date().toISOString(),
          isCompleted: storyData.isCompleted || false,
          level: storyData.level || "L1",
          createdAt: storyData.createdAt || new Date().toISOString(),
          userId: storyData.userId || user?.id || "",
          updatedAt: storyData.updatedAt || new Date().toISOString(),
        } as unknown as DailyStory;

        // التحقق النهائي من صحة القصة
        if (!originalStory.content || originalStory.words.length === 0) {
          setError("القصة غير مكتملة. يرجى العودة للصفحة السابقة.");
          return;
        }

        setCurrentStory(originalStory);
        setWordStatus({});
        setWordsLearned(0);
        setReadingProgress(0);

        const dailyWords =
          originalStory.words?.filter(
            (word: any) => word.isDailyWord || word.type === "daily"
          ) || [];

        // التحقق من حالة البوب المحفوظة في localStorage
        const today = new Date().toISOString().split("T")[0];
        const dailyWordsModalShownToday = localStorage.getItem(
          "dailyWordsModalShownDate"
        );
        const dailyWordsCompletedToday = localStorage.getItem(
          "dailyWordsCompletedDate"
        );

        if (dailyWords.length > 0) {
          // تحقق من عدد الكلمات المكتملة
          const completedDailyWords = dailyWords.filter(
            (word: any) => word.status && word.status !== "NOT_LEARNED"
          );

          // تحقق من عدد الكلمات المكتملة
          if (completedDailyWords.length >= 7) {
            setDailyWordsCompleted(true);
            setShowDailyWordsModal(false);
            // حفظ حالة إكمال الكلمات اليوم
            localStorage.setItem("dailyWordsCompletedDate", today);
          } else {
            // دائماً اعرض البوب إذا لم تكتمل الكلمات
            setShowDailyWordsModal(true);
            setDailyWordsCompleted(false);
            // حفظ حالة عرض البوب اليوم
            localStorage.setItem("dailyWordsModalShownDate", today);
          }
        } else {
          // إذا لم تكن هناك كلمات يومية محددة، اعرض أول 7 كلمات ككلمات يومية
          const firstSevenWords = originalStory.words?.slice(0, 7) || [];
          if (firstSevenWords.length > 0) {
            // تحقق من عدد الكلمات المكتملة
            const completedFirstWords = firstSevenWords.filter(
              (word: any) => word.status && word.status !== "NOT_LEARNED"
            );

            if (completedFirstWords.length >= 7) {
              setDailyWordsCompleted(true);
              setShowDailyWordsModal(false);
              // حفظ حالة إكمال الكلمات اليوم
              localStorage.setItem("dailyWordsCompletedDate", today);
            } else {
              // دائماً اعرض البوب إذا لم تكتمل الكلمات
              setShowDailyWordsModal(true);
              setDailyWordsCompleted(false);
              // حفظ حالة عرض البوب اليوم
              localStorage.setItem("dailyWordsModalShownDate", today);
            }
          } else {
            setDailyWordsCompleted(true);
            setShowDailyWordsModal(false);
          }
        }

        // إضافة رسالة نجاح
        addNotification("تم تحميل القصة بنجاح! 🎉", "success");
      } catch (error) {
        console.error("Error loading story:", error);
        setError("حدث خطأ في تحميل القصة. يرجى المحاولة مرة أخرى.");
      }
    } else if (!currentStory && !location.state?.story) {
      // إذا لم تكن هناك قصة في location state، حاول جلبها من API
      const fetchStoryFromAPI = async () => {
        setIsLoading(true);
        try {
          const response = await checkDailyStory();
          if (response.success && response.data) {
            // إعادة توجيه مع البيانات الجديدة
            navigate("/stories/daily", {
              state: { story: response.data, fromDashboard: false },
              replace: true,
            });
          } else {
            setError("لم يتم العثور على قصة. يرجى العودة للصفحة السابقة.");
          }
        } catch (error) {
          console.error("Error fetching story from API:", error);
          setError("حدث خطأ في جلب القصة. يرجى المحاولة مرة أخرى.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchStoryFromAPI();
    }
  }, [location.state, currentStory, user?.id, navigate]);

  // Initialize word statuses
  useEffect(() => {
    if (currentStory?.words && currentStory.words.length > 0) {
      const initialStatus: Record<string, WordStatus> = {};
      let knownCount = 0;

      currentStory.words.forEach((word) => {
        const status = (word.status as WordStatus) || "NOT_LEARNED";
        initialStatus[word.word] = status;
        if (status === "KNOWN") knownCount++;
      });

      setWordStatus(initialStatus);
      setWordsLearned(knownCount);
      setReadingProgress(
        (knownCount / (currentStory?.words?.length || 1)) * 100
      );

      setTimeout(() => {
        fetchWordStatistics();
        fetchRemainingRequests();
      }, 2000);
    }
  }, [currentStory]);

  // Reading time tracker
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (currentStory) {
      interval = setInterval(() => {
        setReadingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStory]);

  // Error state
  if (!currentStory && error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-rose-100 to-orange-100 dark:from-rose-900/50 dark:to-orange-900/50 rounded-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-rose-600 dark:text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            {error}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            يرجى العودة للصفحة السابقة أو المحاولة مرة أخرى
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              العودة
            </button>
            <button
              onClick={() => navigate("/stories")}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              جميع القصص
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Daily words modal
  if (showDailyWordsModal && !dailyWordsCompleted) {
    const dailyWords =
      currentStory?.words?.filter(
        (word) => word.isDailyWord || word.type === "daily"
      ) || [];

    // إذا لم تكن هناك كلمات يومية محددة، استخدم أول 7 كلمات
    const wordsToShow =
      dailyWords.length > 0
        ? dailyWords
        : currentStory?.words?.slice(0, 7) || [];

    const completedCount = wordsToShow.filter(
      (word) => wordStatus[word.word] && wordStatus[word.word] !== "NOT_LEARNED"
    ).length;
    const progressPercentage =
      wordsToShow.length > 0 ? (completedCount / wordsToShow.length) * 100 : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-2">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                🎯 الكلمات اليومية
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg mb-4 px-2">
                يجب عليك التفاعل مع جميع الكلمات اليومية قبل قراءة القصة
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-800 dark:text-blue-200 font-semibold text-sm sm:text-base">
                    التقدم: {completedCount} من {wordsToShow.length} كلمة
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(progressPercentage)}%
                </div>
              </div>
              <div className="w-full h-3 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Daily Words Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {wordsToShow.map((word, index) => {
                const isCompleted =
                  wordStatus[word.word] &&
                  wordStatus[word.word] !== "NOT_LEARNED";
                const status = wordStatus[word.word] || "NOT_LEARNED";

                return (
                  <div
                    key={index}
                    className={`group p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                      isCompleted
                        ? "  shadow-emerald-100 dark:shadow-emerald-900/20"
                        : "shadow-blue-100 dark:shadow-blue-900/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {word.word}
                      </h3>
                      <div className="flex items-center gap-3">
                        {isCompleted && (
                          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div
                          className={`w-4 h-4 rounded-full shadow-sm ${
                            status === "KNOWN"
                              ? "bg-emerald-500"
                              : status === "PARTIALLY_KNOWN"
                              ? "bg-amber-500"
                              : status === "UNKNOWN"
                              ? "bg-rose-500"
                              : "bg-blue-500"
                          }`}
                        ></div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-3">
                        {word.meaning}
                      </p>
                      {word.sentence && (
                        <div className="space-y-2">
                          <p className="text-sm text-slate-600 dark:text-slate-400 italic bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                            "{word.sentence}"
                          </p>
                          {word.sentence_ar && (
                            <p className="text-sm text-slate-500 dark:text-slate-500 italic text-right bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                              "{word.sentence_ar}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {[
                        {
                          status: "KNOWN",
                          label: "أعرفها",
                          color: "emerald",
                          icon: Check,
                        },
                        {
                          status: "PARTIALLY_KNOWN",
                          label: "جزئياً",
                          color: "amber",
                          icon: HelpCircle,
                        },
                        {
                          status: "UNKNOWN",
                          label: "لا أعرف",
                          color: "rose",
                          icon: X,
                        },
                      ].map((option) => {
                        const isSelected =
                          wordStatus[word.word] === option.status;
                        const colorClasses = {
                          emerald: isSelected
                            ? "bg-emerald-500 text-white shadow-lg ring-2 ring-emerald-200 dark:ring-emerald-400"
                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-800/50",
                          amber: isSelected
                            ? "bg-amber-500 text-white shadow-lg ring-2 ring-amber-200 dark:ring-amber-400"
                            : "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-800/50",
                          rose: isSelected
                            ? "bg-rose-500 text-white shadow-lg ring-2 ring-rose-200 dark:ring-rose-400"
                            : "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-800/50",
                        };

                        return (
                          <button
                            key={option.status}
                            onClick={() =>
                              handleWordStatusChange(
                                word.word,
                                option.status as any
                              )
                            }
                            className={`flex-1 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 transform hover:scale-105 ${
                              colorClasses[
                                option.color as keyof typeof colorClasses
                              ]
                            }`}
                          >
                            <option.icon className="w-3 h-3 sm:w-3 sm:h-3" />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentStory) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Enhanced Header */}
      <header className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => {
                    fetchWordStatistics();
                    fetchRemainingRequests();
                    setTimeout(() => navigate("/stories"), 500);
                  }}
                  className="p-2 sm:p-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 flex-shrink-0"
                >
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
                    {currentStory?.title
                      ? currentStory.title.split(" - ")[0]
                      : "القصة"}
                  </h1>
                  <div className="flex items-center gap-1 sm:gap-2 mt-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      {formatTime(readingTime)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    speakText(currentStory?.content || "");
                    fetchRemainingRequests();
                  }
                }}
                className={`p-2 sm:p-2.5 rounded-xl transition-all duration-200 ${
                  isSpeaking
                    ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 shadow-lg"
                    : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 shadow-sm hover:shadow-md"
                }`}
                title={isSpeaking ? "إيقاف القراءة" : "استمع للقصة"}
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>

              <button
                onClick={handleCompleteStory}
                className="px-2 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 flex items-center gap-1 sm:gap-2 shadow-lg hover:shadow-xl hover:scale-105 font-medium text-xs sm:text-sm"
              >
                <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">إنهاء القصة</span>
                <span className="sm:hidden">إنهاء</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-8">
          {/* Story Content */}
          <div
            dir="ltr"
            className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-8 lg:p-10"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                story
              </h2>
            </div>
            <div className="prose prose-sm sm:prose-lg dark:prose-invert max-w-none">
              <div className="text-slate-800 dark:text-slate-200 leading-relaxed text-base sm:text-xl lg:text-2xl text-justify font-light">
                {renderContent(currentStory?.content || "")}
              </div>
            </div>
          </div>

          {/* Translation */}
          <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-8 lg:p-10">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm sm:text-lg">
                    ع
                  </span>
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  الترجمة العربية
                </h3>
              </div>
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    speakText(currentStory?.translation || "", "ar-SA");
                    setTimeout(() => fetchRemainingRequests(), 2000);
                  }
                }}
                className={`p-2 sm:p-3 rounded-xl transition-all duration-200 ${
                  isSpeaking
                    ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 shadow-lg"
                    : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 shadow-sm hover:shadow-md"
                }`}
                title={isSpeaking ? "إيقاف القراءة" : "استمع للترجمة"}
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
            <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-base sm:text-lg lg:text-xl text-right font-light">
              {currentStory?.translation || ""}
            </div>
          </div>

          {/* Enhanced Learning Progress */}
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                إحصائيات التعلم
              </h3>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              {[
                {
                  label: "كلمات اليوم",
                  value:
                    currentStory?.words?.filter((w) => w.isDailyWord).length ||
                    0,
                  color: "blue",
                  gradient: "from-blue-500 to-blue-600",
                  bgColor: "bg-blue-50 dark:bg-blue-900/20",
                  icon: Star,
                },
                {
                  label: "معروفة",
                  value: Object.values(wordStatus).filter((s) => s === "KNOWN")
                    .length,
                  color: "emerald",
                  gradient: "from-emerald-500 to-emerald-600",
                  bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
                  icon: Check,
                },
                {
                  label: "جزئية",
                  value: Object.values(wordStatus).filter(
                    (s) => s === "PARTIALLY_KNOWN"
                  ).length,
                  color: "amber",
                  gradient: "from-amber-500 to-amber-600",
                  bgColor: "bg-amber-50 dark:bg-amber-900/20",
                  icon: HelpCircle,
                },
                {
                  label: "جديدة",
                  value: Object.values(wordStatus).filter(
                    (s) => s === "UNKNOWN"
                  ).length,
                  color: "rose",
                  gradient: "from-rose-500 to-rose-600",
                  bgColor: "bg-rose-50 dark:bg-rose-900/20",
                  icon: X,
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`text-center p-3 sm:p-6 ${stat.bgColor} rounded-xl border border-${stat.color}-200 dark:border-${stat.color}-800 hover:scale-105 transition-transform duration-200`}
                >
                  <div
                    className={`w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r ${stat.gradient} rounded-full mx-auto mb-2 sm:mb-4 flex items-center justify-center shadow-lg`}
                  >
                    <stat.icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div
                    className={`text-xl sm:text-3xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400 mb-1 sm:mb-2`}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Section */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 sm:gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300 font-medium">
                    التقدم الإجمالي
                  </span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(
                    (wordsLearned / (currentStory.words?.length || 1)) * 100
                  )}
                  %
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 sm:h-4 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out shadow-sm"
                  style={{
                    width: `${Math.round(
                      (wordsLearned / (currentStory.words?.length || 1)) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    الطلبات المتبقية
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-slate-700 dark:text-slate-300">
                    {remainingRequests}
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    وقت القراءة
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-slate-700 dark:text-slate-300">
                    {formatTime(readingTime)}
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    النقاط المكتسبة
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-slate-700 dark:text-slate-300">
                    {wordsLearned * 10}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Word Modal */}
      {showWordModal && selectedWord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-8 max-w-lg w-full relative animate-in fade-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowWordModal(false)}
              className="absolute top-2 sm:top-4 right-2 sm:right-4 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 text-2xl font-bold focus:outline-none transition-colors duration-200 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="text-center">
              {/* Word Status Tags */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
                {selectedWord.isDailyWord && (
                  <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs sm:text-sm font-medium border border-blue-200 dark:border-blue-700">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                    كلمة يومية
                  </div>
                )}
                {(() => {
                  const status =
                    wordStatus[selectedWord.word] ||
                    selectedWord.status ||
                    "NOT_LEARNED";
                  const statusConfig = {
                    KNOWN: { color: "emerald", label: "معروفة", icon: Check },
                    PARTIALLY_KNOWN: {
                      color: "amber",
                      label: "جزئية",
                      icon: HelpCircle,
                    },
                    UNKNOWN: { color: "rose", label: "غير معروفة", icon: X },
                    NOT_LEARNED: {
                      color: selectedWord.isDailyWord ? "blue" : "slate",
                      label: "غير متعلمة",
                      icon: Brain,
                    },
                  };
                  const config =
                    statusConfig[status as keyof typeof statusConfig] ||
                    statusConfig.NOT_LEARNED;

                  return (
                    <div
                      className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-${config.color}-100 to-${config.color}-200 dark:from-${config.color}-900/30 dark:to-${config.color}-800/30 text-${config.color}-700 dark:text-${config.color}-300 rounded-full text-xs sm:text-sm font-medium border border-${config.color}-200 dark:border-${config.color}-700`}
                    >
                      <config.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      {config.label}
                    </div>
                  );
                })()}
              </div>

              {/* Word Display */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-2 sm:mb-3 tracking-tight">
                  {selectedWord.word}
                </h3>
                <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                  {selectedWord.meaning}
                </p>
              </div>

              {/* Example Sentences */}
              {selectedWord.sentence && (
                <div className="mb-6 sm:mb-8 space-y-3">
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-blue-900/20 rounded-xl p-3 sm:p-6 border border-slate-200 dark:border-slate-600">
                    <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-lg mb-2 sm:mb-3 font-medium">
                      "{selectedWord.sentence}"
                    </p>
                    {selectedWord.sentence_ar && (
                      <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-base text-right leading-relaxed">
                        "{selectedWord.sentence_ar}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {[
                  {
                    status: "KNOWN",
                    label: "أعرفها",
                    color: "emerald",
                    icon: Check,
                  },
                  {
                    status: "PARTIALLY_KNOWN",
                    label: "جزئياً",
                    color: "amber",
                    icon: HelpCircle,
                  },
                  {
                    status: "UNKNOWN",
                    label: "لا أعرف",
                    color: "rose",
                    icon: X,
                  },
                ].map((option) => (
                  <button
                    key={option.status}
                    onClick={() =>
                      handleWordStatusChange(
                        selectedWord.word,
                        option.status as any
                      )
                    }
                    className={`px-2 sm:px-4 py-3 sm:py-4 bg-gradient-to-r from-${option.color}-500 to-${option.color}-600 text-white rounded-xl hover:from-${option.color}-600 hover:to-${option.color}-700 transition-all duration-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-1 sm:gap-2 shadow-lg hover:shadow-xl transform hover:scale-105`}
                  >
                    <option.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Audio Button */}
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    speakText(selectedWord.word);
                    setTimeout(() => fetchRemainingRequests(), 1500);
                  }
                }}
                className={`w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 sm:gap-3 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base ${
                  isSpeaking
                    ? "bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700"
                    : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                }`}
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                {isSpeaking ? "إيقاف الصوت" : "استمع للكلمة"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl">
              <Award className="w-10 h-10 text-white" />
            </div>

            <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              🎉 مبروك!
            </h3>

            <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg leading-relaxed">
              لقد أكملت قراءة القصة بنجاح وتعلمت{" "}
              <span className="font-bold text-emerald-600">{wordsLearned}</span>{" "}
              كلمة جديدة!
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {wordsLearned}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  كلمات معروفة
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(
                    (wordsLearned / (currentStory?.words?.length || 1)) * 100
                  )}
                  %
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  نسبة الإتمام
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl border border-violet-200 dark:border-violet-700">
                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                  {wordsLearned * 10}
                </div>
                <div className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                  نقاط
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate("/stories")}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl font-medium"
              >
                <Home className="w-4 h-4" />
                القصص
              </button>
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  navigate("/story-exam", { state: { story: currentStory } });
                }}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl font-medium"
              >
                <GraduationCap className="w-4 h-4" />
                اختبار
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Notifications */}
      <div className="fixed top-2 sm:top-4 right-2 sm:right-4 z-50 space-y-2 sm:space-y-3 max-w-xs sm:max-w-sm">
        {notifications.map((notification) => {
          const notificationStyles = {
            success: {
              bg: "bg-emerald-50 dark:bg-emerald-900/30",
              border: "border-emerald-200 dark:border-emerald-700",
              text: "text-emerald-800 dark:text-emerald-200",
              icon: Check,
            },
            error: {
              bg: "bg-rose-50 dark:bg-rose-900/30",
              border: "border-rose-200 dark:border-rose-700",
              text: "text-rose-800 dark:text-rose-200",
              icon: X,
            },
            info: {
              bg: "bg-blue-50 dark:bg-blue-900/30",
              border: "border-blue-200 dark:border-blue-700",
              text: "text-blue-800 dark:text-blue-200",
              icon: Brain,
            },
          };

          const style = notificationStyles[notification.type];

          return (
            <div
              key={notification.id}
              className={`${style.bg} ${style.border} ${style.text} p-3 sm:p-4 rounded-xl shadoXw-lg border transition-all duration-300 backdrop-blur-sm animate-in slide-in-from-right-4 fade-in`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <style.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium leading-relaxed">
                    {notification.message}
                  </p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 ml-1 sm:ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
