/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../core/providers/AuthProvider";
import { RiArrowRightLine, RiArrowLeftLine } from "react-icons/ri";
import {
  getDailyWords,
  getAllCategories,
  learnWord,
  getLearnedWords,
  addWord,
  completeDailyWords,
  addPrivateWordsAchievement,
  getPrivateWords,
} from "../../../core/utils/api";
import { useLocation, useNavigate } from "react-router-dom";
import { Loading } from "../../../presentation/components";
import { FaBookOpen, FaVolumeUp } from "react-icons/fa";
import { SpeakerIcon } from "lucide-react";

// تعريف AllWordsResponse أعلى الملف
export type AllWordsResponse = { public: any[]; private: any[] };

export const DailyWordsPage: React.FC = () => {
  const { user } = useAuth();
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<
    "daily" | "known" | "partially-known" | "unknown" | "private"
  >("daily");
  const [learnedWords, setLearnedWords] = useState<any[] | null>(null);
  const [privateWords, setPrivateWords] = useState<any[] | null>(null);
  const [allCategoriesData, setAllCategoriesData] = useState<any>(null);
  const [loadingTab, setLoadingTab] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<{
    learned?: number;
    private?: number;
    allCategories?: number;
  }>({});

  const [dailyWordsBlocked, setDailyWordsBlocked] = useState(false);
  const [unknownWords, setUnknownWords] = useState<any[]>([]);

  // Pagination state
  const [learnedPage, setLearnedPage] = useState(1);
  const [privatePage, setPrivatePage] = useState(1);
  const CARDS_PER_PAGE = 6;

  const location = useLocation();
  const navigate = useNavigate();

  // دالة نطق الكلمة الإنجليزية
  const speakWord = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } else {
      alert("المتصفح لا يدعم ميزة النطق الصوتي.");
    }
  };

  // دالة لتصفية الكلمات المكررة حسب الكلمة فقط
  function uniqueWords(arr: any[]) {
    const seen = new Set();
    return arr.filter((item) => {
      if (seen.has(item.word)) return false;
      seen.add(item.word);
      return true;
    });
  }

  useEffect(() => {
    if (location.state && location.state.tab) {
      setTab(location.state.tab);
    }
    // eslint-disable-next-line
  }, [location.state]);

  useEffect(() => {
    if (dailyWordsBlocked) return;
    const fetchWords = async () => {
      setLoading(true);
      const res = await getDailyWords();
      if (res.success && res.data && res.data.words) {
        // استخدام الكلمات الجديدة من API مباشرة
        const today = new Date().toISOString().split("T")[0];
        const lastFetchDate = localStorage.getItem("lastFetchDate");

        // إذا كان اليوم مختلف، جلب كلمات جديدة
        if (lastFetchDate !== today) {
          // مسح البيانات القديمة عند بداية يوم جديد
          localStorage.removeItem("unknownWords");

          const newWords = res.data.words.map((word: any, idx: number) => ({
            ...word,
            id: word.id || word.word || idx,
          }));

          setWords(newWords);
          setUnknownWords([]); // لا نحفظ أي كلمات حتى يتفاعل المستخدم

          // حفظ التاريخ فقط
          localStorage.setItem("lastFetchDate", today);
        } else {
          // استخدام الكلمات المخزنة من نفس اليوم
          const unknownWordsStored =
            localStorage.getItem("unknownWords") || "[]";
          const unknownWordsArray = JSON.parse(unknownWordsStored);

          // عرض جميع الكلمات الأصلية
          const allWords = res.data.words.map((word: any, idx: number) => ({
            ...word,
            id: word.id || word.word || idx,
          }));

          setWords(allWords);
          setUnknownWords(unknownWordsArray);
        }
      } else if (res.message) {
        setWords([]);
      }
      setLoading(false);
    };
    fetchWords();

    // جلب جميع البيانات الشاملة
    fetchAllCategories();
  }, [dailyWordsBlocked]);

  // جلب الكلمات المتعلمة عند الحاجة - مع cache
  const fetchLearnedWords = async () => {
    const now = Date.now();
    const cacheTime = 5 * 60 * 1000; // 5 دقائق cache

    // التحقق من cache
    if (
      learnedWords &&
      lastFetchTime.learned &&
      now - lastFetchTime.learned < cacheTime
    ) {
      return; // استخدام البيانات المخزنة
    }

    setLoadingTab(true);
    const res = await getLearnedWords();
    if (res.success && res.data) {
      // إذا كانت الاستجابة تحتوي على public وprivate
      if (Array.isArray((res.data as any).public)) {
        const uniqueLearned = uniqueWords((res.data as any).public).map(
          (word: any, idx: number) => ({
            ...word,
            id: word.id || word.word || idx,
          })
        );
        setLearnedWords(uniqueLearned);
      } else if (Array.isArray((res.data as any).words)) {
        // دعم الاستجابة القديمة
        const uniqueLearned = uniqueWords((res.data as any).words).map(
          (word: any, idx: number) => ({
            ...word,
            id: word.id || word.word || idx,
          })
        );
        setLearnedWords(uniqueLearned);
      } else {
        setLearnedWords([]);
      }
    } else {
      setLearnedWords([]);
    }
    setLastFetchTime((prev) => ({ ...prev, learned: now }));
    setLoadingTab(false);
  };

  // جلب كلمات الطالب الخاصة عند الحاجة - مع cache
  const fetchAllCategories = async () => {
    const now = Date.now();
    const cacheTime = 5 * 60 * 1000; // 5 دقائق cache

    // التحقق من cache
    if (
      allCategoriesData &&
      lastFetchTime.allCategories &&
      now - lastFetchTime.allCategories < cacheTime
    ) {
      return; // استخدام البيانات المخزنة
    }

    setLoadingTab(true);
    try {
      const res = await getAllCategories();
      if (res.success && res.data) {
        const data = res.data as any;
        setAllCategoriesData(data);

        // تحديث البيانات الفردية حسب التبويب الحالي
        if (data?.daily) {
          setWords(data.daily.words || []);
        }
        if (data?.known) {
          setLearnedWords(data.known.words || []);
        }
        if (data?.private) {
          setPrivateWords(data.private.words || []);
        }
        if (data?.unknown) {
          setUnknownWords(data.unknown.words || []);
        }
      } else {
        setAllCategoriesData(null);
      }
    } catch (error) {
      console.error("Error fetching all categories:", error);
      setAllCategoriesData(null);
    }
    setLastFetchTime((prev) => ({ ...prev, allCategories: now }));
    setLoadingTab(false);
  };

  const fetchPrivateWords = async () => {
    const now = Date.now();
    const cacheTime = 5 * 60 * 1000; // 5 دقائق cache

    // التحقق من cache
    if (
      privateWords &&
      lastFetchTime.private &&
      now - lastFetchTime.private < cacheTime
    ) {
      return; // استخدام البيانات المخزنة
    }

    setLoadingTab(true);
    const res = await getPrivateWords();
    if (res.success && Array.isArray(res.data)) {
      setPrivateWords(res.data);
    } else {
      setPrivateWords([]);
    }
    setLastFetchTime((prev) => ({ ...prev, private: now }));
    setLoadingTab(false);
  };

  // عند تغيير التبويب - مع cache للبيانات
  useEffect(() => {
    const now = Date.now();
    const cacheTime = 5 * 60 * 1000; // 5 دقائق cache

    if (tab === "known" && !loadingTab) {
      const shouldFetch =
        !learnedWords ||
        !lastFetchTime.learned ||
        now - lastFetchTime.learned >= cacheTime;

      if (shouldFetch) {
        fetchLearnedWords();
      }
    }

    if (tab === "private" && !loadingTab) {
      const shouldFetch =
        !privateWords ||
        !lastFetchTime.private ||
        now - lastFetchTime.private >= cacheTime;

      if (shouldFetch) {
        fetchPrivateWords();
      }
    }
  }, [tab, loadingTab]);

  const currentWord = allCategoriesData?.daily?.words
    ? allCategoriesData.daily.words[currentWordIndex]
    : words[currentWordIndex];
  const learnedCount = allCategoriesData?.daily?.words
    ? allCategoriesData.daily.words.filter((word: any) => word.isLearned).length
    : words.filter((word) => word.isLearned).length;

  const nextWord = () => {
    const currentWords = allCategoriesData?.daily?.words || words;
    if (currentWordIndex < currentWords.length - 1) {
      setCurrentWordIndex((prev) => prev + 1);
      setShowAnswer(false);
    }
  };

  const prevWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex((prev) => prev - 1);
      setShowAnswer(false);
    }
  };

  // إعادة تعيين currentWordIndex عند تغيير الكلمات
  useEffect(() => {
    if (words.length > 0 && currentWordIndex >= words.length) {
      setCurrentWordIndex(0);
    }
  }, [words.length, currentWordIndex]);

  // إغلاق المودال عند الضغط خارجها
  const handleModalBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setShowModal(false);
  };

  // عند الضغط على زر نتعلمها مع AI
  const handleNavigateToChat = () => {
    navigate("/chat-with-ai");
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    const englishRegex = /^[A-Za-z\s'-]+$/;
    const arabicRegex = /^[\u0600-\u06FF\s0-9.,'"!?\-]+$/;
    let isValid = true;

    if (!englishRegex.test(newWord.trim())) {
      setWordError("يرجى إدخال كلمة إنجليزية فقط (بدون أرقام أو رموز)");
      isValid = false;
    } else {
      setWordError("");
    }

    if (!arabicRegex.test(newMeaning.trim())) {
      setMeaningError("يرجى إدخال معنى عربي فقط (بدون أحرف إنجليزية)");
      isValid = false;
    } else {
      setMeaningError("");
    }

    if (!isValid) return;

    try {
      await addWord({ word: newWord.trim(), meaning: newMeaning.trim() });
      setNewWord("");
      setNewMeaning("");
      setShowModal(false);

      // تحديث البيانات المحلية بدلاً من إعادة جلبها
      const newWordData = {
        id: Date.now(),
        word: newWord.trim(),
        meaning: newMeaning.trim(),
        english: newWord.trim(),
        arabic: newMeaning.trim(),
      };

      setPrivateWords((prev) =>
        prev ? [...prev, newWordData] : [newWordData]
      );
      setLastFetchTime((prev) => ({ ...prev, private: Date.now() }));
    } catch (error) {
      // يمكن إضافة رسالة خطأ هنا إذا لزم الأمر
    }
  };

  // أعلى الكومبوننت:
  const [wordError, setWordError] = useState("");
  const [meaningError, setMeaningError] = useState("");

  // دالة لإعادة تعيين حالة البوب عند بداية يوم جديد
  const resetDailyModalState = () => {
    const today = new Date().toISOString().split("T")[0];
    const lastShownDate = localStorage.getItem("dailyWordsModalLastShown");

    // إذا كان اليوم مختلف، نعيد تعيين حالة البوب
    if (lastShownDate !== today) {
      localStorage.removeItem("dailyWordsModalShown");
      localStorage.removeItem("dailyWordsModalLastShown");
      localStorage.removeItem("dailyWordsCompleted");
      localStorage.removeItem("dailyWordsCompletedDate");
    }
  };

  // دالة لمسح جميع البيانات المحفوظة (للتطوير والاختبار)
  const clearAllStoredData = () => {
    localStorage.removeItem("unknownWords");
    localStorage.removeItem("lastFetchDate");
    localStorage.removeItem("dailyWordsModalShown");
    localStorage.removeItem("dailyWordsModalLastShown");
    localStorage.removeItem("dailyWordsCompleted");
    localStorage.removeItem("dailyWordsCompletedDate");
    console.log("All stored data cleared");
  };

  if (user?.role === "ADMIN" || user?.role === "TRAINER") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-lg mx-auto bg-white/10 dark:bg-gray-800/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 text-center border border-white/20 dark:border-gray-700/30">
            <div className="w-20 h-20 bg-gradient-to-r from-red-500 via-pink-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl animate-bounce">
              <svg
                className="w-10 h-10 text-white"
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
            <h2 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-6">
              غير مسموح بالوصول
            </h2>
            <p className="text-gray-300 dark:text-gray-400 leading-relaxed text-lg">
              هذه الصفحة متاحة فقط للمستخدمين العاديين. يرجى التواصل مع الإدارة
              للحصول على المساعدة.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screenrelative overflow-hidden flex items-center justify-center">
        <div className="text-center relative z-10">
          <Loading
            variant="video"
            size="xl"
            text="جاري تحميل الكلمات..."
            className="text-white"
            isOverlay
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900 relative overflow-hidden">
      <div className="w-full h-full px-0 py-0 relative z-10">
        {/* Enhanced Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FaBookOpen color="#2563eb" size={24} />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  الكلمات اليومية
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-sm lg:text-base">
                  تعلم{" "}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    15
                  </span>{" "}
                  كلمة من قائمة الكلمات اليومية
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-xl transition-all duration-300 flex items-center gap-2 group transform hover:scale-105"
              >
                <span className="text-lg group-hover:rotate-90 transition-transform duration-300">
                  ＋
                </span>
                <span>أضف كلمة خاصة</span>
              </button>

              {/* زر إعادة تعيين حالة البوب */}
              <button
                onClick={() => {
                  clearAllStoredData();
                  window.location.reload();
                }}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-6 rounded-xl shadow-xl transition-all duration-300 flex items-center gap-2 group transform hover:scale-105"
                title="إعادة تعيين حالة البوب"
              >
                <span className="text-lg">🔄</span>
                <span>إعادة تعيين</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-2 shadow-xl border border-gray-200 dark:border-gray-700">
            <button
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 focus:outline-none ${
                tab === "daily"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
              onClick={() => setTab("daily")}
            >
              <span>الكلمات اليومية</span>
              {(allCategoriesData?.daily?.totalWords || words.length) > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-white/30 rounded-full font-bold">
                  {allCategoriesData?.daily?.totalWords ||
                    allCategoriesData?.daily?.words?.length ||
                    words.length}
                </span>
              )}
            </button>
            <button
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 focus:outline-none ${
                tab === "known"
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-105"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
              onClick={() => setTab("known")}
            >
              <span>المعروفة</span>
              {(allCategoriesData?.known?.totalWords || learnedWords?.length) >
                0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-white/30 rounded-full font-bold">
                  {allCategoriesData?.known?.totalWords ||
                    allCategoriesData?.known?.words?.length ||
                    learnedWords?.length ||
                    0}
                </span>
              )}
            </button>
            <button
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 focus:outline-none ${
                tab === "partially-known"
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg transform scale-105"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
              onClick={() => setTab("partially-known")}
            >
              <span>المعروفة جزئياً</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-white/30 rounded-full font-bold">
                {allCategoriesData?.partiallyKnown?.totalWords ||
                  allCategoriesData?.partiallyKnown?.words?.length ||
                  0}
              </span>
            </button>
            <button
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 focus:outline-none ${
                tab === "unknown"
                  ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg transform scale-105"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
              onClick={() => setTab("unknown")}
            >
              <span>غير المعروفة</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-white/30 rounded-full font-bold">
                {allCategoriesData?.unknown?.totalWords ||
                  allCategoriesData?.unknown?.words?.length ||
                  unknownWords.length}
              </span>
            </button>
            <button
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 focus:outline-none ${
                tab === "private"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
              onClick={() => setTab("private")}
            >
              <span>كلماتي الخاصة</span>
              {(allCategoriesData?.private?.totalWords ||
                privateWords?.length) > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-white/30 rounded-full font-bold">
                  {allCategoriesData?.private?.totalWords ||
                    allCategoriesData?.private?.words?.length ||
                    privateWords?.length ||
                    0}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* محتوى التبويب */}
        {tab === "daily" && (
          <>
            {/* Enhanced empty state */}
            {(!allCategoriesData?.daily?.words ||
              allCategoriesData.daily.words.length === 0) && (
              <div className="mb-6 flex justify-center">
                <div className="max-w-lg bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-center border border-gray-200 dark:border-gray-700">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                    لا توجد كلمات اليوم
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    لم يتم العثور على كلمات لليوم. تحقق مرة أخرى لاحقاً أو تواصل
                    مع الإدارة.
                  </p>
                </div>
              </div>
            )}

            {/* رسالة الإكمال أو زر نتعلمها مع AI */}
            {(!allCategoriesData?.daily?.words ||
              allCategoriesData.daily.words.length === 0) &&
              (!allCategoriesData?.unknown?.words ||
                allCategoriesData.unknown.words.length === 0) && (
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-center shadow-lg">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg
                        className="w-10 h-10 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">
                      🎉 مبروك! لقد أكملت جميع الكلمات لهذا اليوم
                    </h3>
                    <p className="text-white/90 text-lg mb-6">
                      لقد تعلمت جميع الكلمات بنجاح! عد غداً لتعلم كلمات جديدة
                    </p>
                  </div>
                </div>
              )}

            {/* زر نتعلمها مع AI - يظهر فقط عند الانتهاء من الكلمات الحالية */}
            {(!allCategoriesData?.daily?.words ||
              allCategoriesData.daily.words.length === 0) &&
              allCategoriesData?.unknown?.words &&
              allCategoriesData.unknown.words.length > 0 && (
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center shadow-lg">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg
                        className="w-10 h-10 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">
                      🎯 لديك {allCategoriesData.unknown.words.length} كلمة
                      تحتاج تعلمها
                    </h3>
                    <p className="text-white/90 text-lg mb-6">
                      لقد انتهيت من جميع الكلمات! الآن دعنا نتعلم الكلمات
                      المجهولة مع الذكاء الاصطناعي
                    </p>
                    <button
                      onClick={handleNavigateToChat}
                      className="bg-white text-purple-600 font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
                    >
                      نتعلمها مع AI 🤖
                    </button>
                  </div>
                </div>
              )}

            {/* Enhanced Main Content - Mobile Optimized */}
            <div className="lg:col-span-3 mb-8">
              {/* Enhanced Word Card */}
              {allCategoriesData?.daily?.words &&
                allCategoriesData.daily.words[currentWordIndex] && (
                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl p-4 lg:p-8 border border-gray-200 dark:border-gray-700">
                    <div className="text-center mb-4 lg:mb-6">
                      <div className="flex items-center justify-between lg:justify-center lg:gap-3 mb-4 lg:mb-6">
                        <button
                          onClick={prevWord}
                          disabled={currentWordIndex === 0}
                          className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg lg:rounded-xl flex items-center justify-center shadow-md lg:shadow-lg transition-all duration-300 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100"
                        >
                          <RiArrowRightLine className="w-5 h-5 lg:w-6 lg:h-6" />
                        </button>

                        <div className="text-center flex-1 lg:flex-initial lg:min-w-0">
                          <div className="mx-2 lg:mx-0">
                            {/* حالة الكلمة */}
                            {currentWord.status && (
                              <div className="flex justify-center mb-2 lg:mb-3">
                                <span
                                  className={`px-2 py-1 lg:px-3 lg:py-1 rounded-full text-xs font-medium lg:font-bold ${
                                    currentWord.status === "KNOWN"
                                      ? "bg-green-100/80 text-green-700 border border-green-300/50"
                                      : currentWord.status === "PARTIALLY_KNOWN"
                                      ? "bg-yellow-100/80 text-yellow-700 border border-yellow-300/50"
                                      : "bg-red-100/80 text-red-700 border border-red-300/50"
                                  }`}
                                >
                                  {currentWord.status === "KNOWN"
                                    ? "معروفة"
                                    : currentWord.status === "PARTIALLY_KNOWN"
                                    ? "معروفة جزئياً"
                                    : "غير معروفة"}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-center gap-3 lg:gap-4 text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 lg:mb-3 break-words">
                              <span className="text-center select-text">
                                {currentWord?.word || currentWord?.english}
                              </span>
                              <button
                                type="button"
                                aria-label="استمع إلى الكلمة"
                                className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                                onClick={() =>
                                  speakWord(
                                    currentWord?.word || currentWord?.english
                                  )
                                }
                              >
                                <FaVolumeUp
                                  size={24}
                                  className="text-blue-700"
                                />
                              </button>
                            </div>

                            <div className="flex items-center justify-center gap-2 lg:gap-3">
                              <span className="text-xs lg:text-sm font-medium lg:font-semibold text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 px-2 py-1 lg:px-4 lg:py-2 rounded-lg lg:rounded-xl border border-gray-200/50 dark:border-gray-600/50 shadow-sm lg:shadow-md">
                                {currentWordIndex + 1} من{" "}
                                {allCategoriesData?.daily?.words?.length ||
                                  words.length}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={nextWord}
                          disabled={
                            currentWordIndex ===
                            (allCategoriesData?.daily?.words?.length ||
                              words.length) -
                              1
                          }
                          className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg lg:rounded-xl flex items-center justify-center shadow-md lg:shadow-lg transition-all duration-300 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100"
                        >
                          <RiArrowLeftLine className="w-5 h-5 lg:w-6 lg:h-6" />
                        </button>
                      </div>

                      {!showAnswer ? (
                        <button
                          onClick={() => setShowAnswer(true)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 lg:py-4 lg:px-8 rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 lg:gap-3 mx-auto text-sm lg:text-base"
                        >
                          <svg
                            className="w-5 h-5 lg:w-6 lg:h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          عرض المعنى ✨
                        </button>
                      ) : (
                        <div className="space-y-4 lg:space-y-6">
                          <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-blue-200/50 dark:border-blue-700/50 shadow-sm lg:shadow-lg">
                            <h3 className="text-xl lg:text-2xl font-bold text-blue-800 dark:text-blue-200 mb-3 lg:mb-4 flex items-center justify-center gap-2 lg:gap-3">
                              <div className="w-6 h-6 lg:w-8 lg:h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 lg:w-5 lg:h-5 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              المعنى
                            </h3>
                            <p className="text-lg lg:text-xl text-gray-700 dark:text-gray-200 font-medium lg:font-semibold text-center leading-relaxed mb-3 lg:mb-4">
                              {currentWord?.meaning || currentWord?.arabic}
                            </p>

                            {/* عرض الجملة إذا كانت موجودة */}
                            {currentWord?.sentence && (
                              <div className="mt-4 lg:mt-6 p-3 lg:p-4 bg-white/60 dark:bg-gray-800/30 rounded-lg lg:rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                                <h4 className="text-base lg:text-lg font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                                  <svg
                                    className="w-4 h-4 lg:w-5 lg:h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                  </svg>
                                  مثال في جملة
                                </h4>
                                <p className="text-gray-700 dark:text-gray-300 text-center leading-relaxed mb-2 text-sm lg:text-base">
                                  {currentWord.sentence}
                                </p>
                                {currentWord.sentence_ar && (
                                  <p className="text-gray-600 dark:text-gray-400 text-center leading-relaxed text-xs lg:text-sm">
                                    {currentWord.sentence_ar}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center px-2 lg:px-0">
                            <button
                              onClick={async () => {
                                await learnWord(
                                  currentWord?.word ||
                                    currentWord?.english ||
                                    currentWord?.id
                                );

                                // تحديث البيانات بعد تعلم الكلمة
                                fetchAllCategories();

                                // الانتقال للكلمة التالية
                                const currentWords =
                                  allCategoriesData?.daily?.words || words;
                                if (
                                  currentWordIndex <
                                  currentWords.length - 1
                                ) {
                                  setCurrentWordIndex(currentWordIndex + 1);
                                } else {
                                  setCurrentWordIndex(0);
                                }
                                setShowAnswer(false);
                              }}
                              className="flex-1 sm:flex-none px-6 py-3 lg:px-8 lg:py-4 rounded-xl lg:rounded-2xl font-bold text-base lg:text-lg transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg lg:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                            >
                              <svg
                                className="w-5 h-5 lg:w-6 lg:h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              أعرفها
                            </button>
                            <button
                              onClick={async () => {
                                // إضافة الكلمة إلى قائمة الكلمات المجهولة
                                const stored =
                                  localStorage.getItem("unknownWords");
                                let arr = stored ? JSON.parse(stored) : [];
                                const key =
                                  currentWord?.id ||
                                  currentWord?.word ||
                                  currentWord?.english;

                                // إضافة الكلمة إلى unknownWords إذا لم تكن موجودة
                                const exists = arr.some(
                                  (w: any) =>
                                    (w.id || w.word || w.english) === key
                                );
                                if (!exists) {
                                  arr.push(currentWord);
                                  localStorage.setItem(
                                    "unknownWords",
                                    JSON.stringify(arr)
                                  );
                                }

                                // تحديث unknownWords state
                                setUnknownWords(arr);

                                // الانتقال للكلمة التالية
                                const currentWords =
                                  allCategoriesData?.daily?.words || words;
                                if (
                                  currentWordIndex <
                                  currentWords.length - 1
                                ) {
                                  setCurrentWordIndex(currentWordIndex + 1);
                                } else {
                                  setCurrentWordIndex(0);
                                }
                                setShowAnswer(false);
                              }}
                              className="flex-1 sm:flex-none px-6 py-3 lg:px-8 lg:py-4 rounded-xl lg:rounded-2xl font-bold text-base lg:text-lg transition-all duration-300 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg lg:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                            >
                              <svg
                                className="w-5 h-5 lg:w-6 lg:h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              لا أعرفها
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>

            {allCategoriesData?.daily?.words &&
              allCategoriesData.daily.words.length > 0 && (
                <div className="grid grid-rows-1 lg:grid-rows-1 gap-8 ">
                  {/* Enhanced Progress Card - Sidebar */}
                  <div className="lg:row-span-1 space-y-6">
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
                          التقدم اليومي
                        </h2>
                      </div>
                      <div className="text-center mb-6">
                        <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                          <svg
                            className="w-32 h-32 transform -rotate-90"
                            viewBox="0 0 120 120"
                          >
                            <circle
                              cx="60"
                              cy="60"
                              r="50"
                              fill="none"
                              stroke="rgba(156, 163, 175, 0.2)"
                              strokeWidth="8"
                            />
                            <circle
                              cx="60"
                              cy="60"
                              r="50"
                              fill="none"
                              stroke="url(#gradient)"
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={`${
                                (learnedCount / words.length) * 314
                              } 314`}
                              style={{
                                transition: "stroke-dasharray 0.8s ease",
                              }}
                            />
                            <defs>
                              <linearGradient
                                id="gradient"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                              >
                                <stop offset="0%" stopColor="#3B82F6" />
                                <stop offset="100%" stopColor="#6366F1" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                              {Math.round(
                                (learnedCount /
                                  (allCategoriesData?.daily?.words?.length ||
                                    words.length)) *
                                  100
                              )}
                              %
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              مكتمل
                            </span>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                          <p className="text-gray-700 dark:text-gray-200 text-sm font-semibold">
                            <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                              {learnedCount}
                            </span>{" "}
                            من{" "}
                            <span className="font-bold text-gray-800 dark:text-white text-lg">
                              {allCategoriesData?.daily?.words?.length ||
                                words.length}
                            </span>{" "}
                            كلمة
                          </p>
                        </div>
                      </div>
                      {/* Enhanced word indicators */}
                      <div className="grid grid-cols-5 gap-2">
                        {(allCategoriesData?.daily?.words || words).map(
                          (word: any, index: number) => (
                            <button
                              key={
                                (word.id || word.word || word.english) +
                                "-" +
                                index
                              }
                              onClick={() => {
                                setCurrentWordIndex(index);
                                setShowAnswer(false);
                              }}
                              className={`w-full h-10 rounded-xl transition-all duration-300 text-sm font-bold border-2 shadow-md transform hover:scale-105 ${
                                index === currentWordIndex
                                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-lg scale-110"
                                  : word.isLearned
                                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500 shadow-lg"
                                  : "bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                              }`}
                              title={`كلمة ${index + 1}${
                                word.isLearned ? " - متعلمة" : ""
                              }`}
                            >
                              {index + 1}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Enhanced Statistics */}
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
                        <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse"></div>
                        إحصائيات سريعة
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700 shadow-md">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <span className="text-gray-700 dark:text-gray-200 text-sm font-semibold">
                              الكلمات المتعلمة
                            </span>
                          </div>
                          <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                            {allCategoriesData?.known?.totalWords ||
                              learnedCount}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-700 shadow-md">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <span className="text-gray-700 dark:text-gray-200 text-sm font-semibold">
                              الكلمات المتبقية
                            </span>
                          </div>
                          <span className="text-orange-600 dark:text-orange-400 font-bold text-lg">
                            {allCategoriesData?.unknown?.totalWords ||
                              (allCategoriesData?.daily?.words?.length ||
                                words.length) - learnedCount}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700 shadow-md">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                              </svg>
                            </div>
                            <span className="text-gray-700 dark:text-gray-200 text-sm font-semibold">
                              إجمالي الكلمات
                            </span>
                          </div>
                          <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                            {allCategoriesData?.summary?.totalCount ||
                              allCategoriesData?.daily?.words?.length ||
                              words.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700 shadow-md">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <span className="text-gray-700 dark:text-gray-200 text-sm font-semibold">
                              الكلمات المجهولة
                            </span>
                          </div>
                          <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">
                            {allCategoriesData?.unknown?.totalWords ||
                              unknownWords.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </>
        )}

        {tab === "known" && (
          <>
            {/* Enhanced empty state for learned words */}
            {!allCategoriesData?.known?.words ||
            allCategoriesData.known.words.length === 0 ? (
              <div className="mb-8 flex justify-center">
                <div className="max-w-lg bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 text-center border border-white/20">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
                    لا توجد كلمات معروفة
                  </h2>
                  <p className="text-gray-200 leading-relaxed text-lg">
                    لم يتم العثور على كلمات معروفة. ابدأ بتعلم الكلمات اليومية.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {allCategoriesData.known.words
                    .slice(
                      (learnedPage - 1) * CARDS_PER_PAGE,
                      learnedPage * CARDS_PER_PAGE
                    )
                    .map((word: any, index: number) => (
                      <div
                        key={
                          (word.id || word.word || word.english) + "-" + index
                        }
                        className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 border border-white/20 flex flex-col items-center text-center relative overflow-hidden group hover:scale-105 transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-2xl relative z-10 group-hover:scale-110 transition-transform duration-300">
                          <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                            />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-black mb-2 relative z-10">
                          {word.english || word.word}
                        </h3>
                        <p className="text-black text-lg mb-4 relative z-10">
                          {word.meaning || word.arabic}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => speakWord(word.english || word.word)}
                            className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-xl shadow-2xl transition-all duration-300 relative z-10 transform hover:scale-105 text-sm"
                          >
                            نطق 🔊
                          </button>
                          <button
                            onClick={async () => {
                              // إضافة الكلمة إلى قائمة الكلمات المجهولة
                              const stored =
                                localStorage.getItem("unknownWords");
                              let arr = stored ? JSON.parse(stored) : [];
                              const key = word.id || word.word || word.english;

                              // إضافة الكلمة إلى unknownWords إذا لم تكن موجودة
                              const exists = arr.some(
                                (w: any) =>
                                  (w.id || w.word || w.english) === key
                              );
                              if (!exists) {
                                arr.push(word);
                                localStorage.setItem(
                                  "unknownWords",
                                  JSON.stringify(arr)
                                );
                                setUnknownWords(arr);
                              }
                            }}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2 px-4 rounded-xl shadow-2xl transition-all duration-300 relative z-10 transform hover:scale-105 text-sm"
                          >
                            لا أعرفها ❌
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Enhanced Pagination */}
                {allCategoriesData.known.words.length > CARDS_PER_PAGE && (
                  <div className="flex justify-center gap-2 mb-4">
                    <button
                      onClick={() => setLearnedPage((p) => Math.max(1, p - 1))}
                      disabled={learnedPage === 1}
                      className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 backdrop-blur-sm border border-white/20"
                    >
                      السابق
                    </button>
                    <span className="px-6 py-3 font-bold text-lg text-white bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                      {learnedPage} /{" "}
                      {Math.ceil(
                        allCategoriesData.known.words.length / CARDS_PER_PAGE
                      )}
                    </span>
                    <button
                      onClick={() =>
                        setLearnedPage((p) =>
                          Math.min(
                            Math.ceil(
                              allCategoriesData.known.words.length /
                                CARDS_PER_PAGE
                            ),
                            p + 1
                          )
                        )
                      }
                      disabled={
                        learnedPage ===
                        Math.ceil(
                          allCategoriesData.known.words.length / CARDS_PER_PAGE
                        )
                      }
                      className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 backdrop-blur-sm border border-white/20"
                    >
                      التالي
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === "partially-known" && (
          <>
            {/* Enhanced empty state for partially known words */}
            {!allCategoriesData?.partiallyKnown?.words ||
            allCategoriesData.partiallyKnown.words.length === 0 ? (
              <div className="mb-8 flex justify-center">
                <div className="max-w-lg bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 text-center border border-white/20">
                  <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-400 bg-clip-text text-transparent mb-4">
                    لا توجد كلمات معروفة جزئياً
                  </h2>
                  <p className="text-gray-200 leading-relaxed text-lg">
                    لم يتم العثور على كلمات معروفة جزئياً. استمر في التعلم
                    لتحسين معرفتك.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {allCategoriesData.partiallyKnown.words.map(
                    (word: any, index: number) => (
                      <div
                        key={
                          (word.id || word.word || word.english) + "-" + index
                        }
                        className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 border border-white/20 flex flex-col items-center text-center relative overflow-hidden group hover:scale-105 transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-2xl relative z-10 group-hover:scale-110 transition-transform duration-300">
                          <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-black mb-2 relative z-10">
                          {word.english || word.word}
                        </h3>
                        <p className="text-black text-lg mb-4 relative z-10">
                          {word.meaning || word.arabic}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => speakWord(word.english || word.word)}
                            className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-xl shadow-2xl transition-all duration-300 relative z-10 transform hover:scale-105 text-sm"
                          >
                            نطق 🔊
                          </button>
                          <button
                            onClick={async () => {
                              await learnWord(word.english || word.word);
                              // تحديث البيانات بعد تعلم الكلمة
                              fetchAllCategories();
                            }}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 px-4 rounded-xl shadow-2xl transition-all duration-300 relative z-10 transform hover:scale-105 text-sm"
                          >
                            أعرفها ✅
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </>
        )}

        {tab === "unknown" && (
          <>
            {/* Enhanced empty state for unknown words */}
            {!allCategoriesData?.unknown?.words ||
            allCategoriesData.unknown.words.length === 0 ? (
              <div className="mb-8 flex justify-center">
                <div className="max-w-lg bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 text-center border border-white/20">
                  <div className="w-20 h-20 bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-pink-400 to-rose-400 bg-clip-text text-transparent mb-4">
                    لا توجد كلمات غير معروفة
                  </h2>
                  <p className="text-gray-200 leading-relaxed text-lg">
                    ممتاز! جميع الكلمات معروفة لديك. استمر في التعلم للحفاظ على
                    تقدمك.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {allCategoriesData.unknown.words.map(
                    (word: any, index: number) => (
                      <div
                        key={
                          (word.id || word.word || word.english) + "-" + index
                        }
                        className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 border border-white/20 flex flex-col items-center text-center relative overflow-hidden group hover:scale-105 transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-4 shadow-2xl relative z-10 group-hover:scale-110 transition-transform duration-300">
                          <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-black mb-2 relative z-10">
                          {word.english || word.word}
                        </h3>
                        <p className="text-black text-lg mb-4 relative z-10">
                          {word.meaning || word.arabic}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => speakWord(word.english || word.word)}
                            className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-xl shadow-2xl transition-all duration-300 relative z-10 transform hover:scale-105 text-sm"
                          >
                            نطق 🔊
                          </button>
                          <button
                            onClick={async () => {
                              await learnWord(word.english || word.word);
                              // تحديث البيانات بعد تعلم الكلمة
                              fetchAllCategories();
                            }}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 px-4 rounded-xl shadow-2xl transition-all duration-300 relative z-10 transform hover:scale-105 text-sm"
                          >
                            أعرفها ✅
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </>
        )}

        {tab === "private" && (
          <>
            {/* Enhanced empty state for private words */}
            {!allCategoriesData?.private?.words ||
            allCategoriesData.private.words.length === 0 ? (
              <div className="mb-8 flex justify-center">
                <div className="max-w-lg bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 text-center border border-white/20">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-4">
                    لا توجد كلمات خاصة
                  </h2>
                  <p className="text-gray-200 leading-relaxed text-lg">
                    لم يتم العثور على كلمات خاصة. أضف كلمات جديدة لتبدأ في
                    التعلم.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {allCategoriesData.private.words
                    .slice(
                      (privatePage - 1) * CARDS_PER_PAGE,
                      privatePage * CARDS_PER_PAGE
                    )
                    .map((word: any, index: number) => (
                      <div
                        key={
                          (word.id || word.word || word.english) + "-" + index
                        }
                        className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 border border-white/20 flex flex-col items-center text-center relative overflow-hidden group hover:scale-105 transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 shadow-2xl relative z-10 group-hover:scale-110 transition-transform duration-300">
                          <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-black mb-2 relative z-10">
                          {word.english || word.word}
                        </h3>
                        <p className="text-black text-lg mb-4 relative z-10">
                          {word.meaning || word.arabic}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => speakWord(word.english || word.word)}
                            className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-xl shadow-2xl transition-all duration-300 relative z-10 transform hover:scale-105 text-sm"
                          >
                            نطق 🔊
                          </button>
                          <button
                            onClick={async () => {
                              // إضافة الكلمة إلى قائمة الكلمات المجهولة
                              const stored =
                                localStorage.getItem("unknownWords");
                              let arr = stored ? JSON.parse(stored) : [];
                              const key = word.id || word.word || word.english;

                              // إضافة الكلمة إلى unknownWords إذا لم تكن موجودة
                              const exists = arr.some(
                                (w: any) =>
                                  (w.id || w.word || w.english) === key
                              );
                              if (!exists) {
                                arr.push(word);
                                localStorage.setItem(
                                  "unknownWords",
                                  JSON.stringify(arr)
                                );
                                setUnknownWords(arr);
                              }
                            }}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2 px-4 rounded-xl shadow-2xl transition-all duration-300 relative z-10 transform hover:scale-105 text-sm"
                          >
                            لا أعرفها ❌
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Enhanced Pagination */}
                {allCategoriesData.private.words.length > CARDS_PER_PAGE && (
                  <div className="flex justify-center gap-2 mb-4">
                    <button
                      onClick={() => setPrivatePage((p) => Math.max(1, p - 1))}
                      disabled={privatePage === 1}
                      className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 backdrop-blur-sm border border-white/20"
                    >
                      السابق
                    </button>
                    <span className="px-6 py-3 font-bold text-lg text-white bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                      {privatePage} /{" "}
                      {Math.ceil(
                        allCategoriesData.private.words.length / CARDS_PER_PAGE
                      )}
                    </span>
                    <button
                      onClick={() =>
                        setPrivatePage((p) =>
                          Math.min(
                            Math.ceil(
                              allCategoriesData.private.words.length /
                                CARDS_PER_PAGE
                            ),
                            p + 1
                          )
                        )
                      }
                      disabled={
                        privatePage ===
                        Math.ceil(
                          allCategoriesData.private.words.length /
                            CARDS_PER_PAGE
                        )
                      }
                      className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 backdrop-blur-sm border border-white/20"
                    >
                      التالي
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Modal لإضافة كلمة خاصة */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={handleModalBackgroundClick}
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 w-full max-w-md relative border border-white/20 dark:border-gray-700/30"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm group"
                title="إغلاق"
              >
                <svg
                  className="w-5 h-5 text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                أضف كلمة خاصة جديدة
              </h2>
              <form onSubmit={handleAddWord} className="space-y-6">
                <div>
                  <label className="block text-gray-700 dark:text-gray-200 font-bold mb-2">
                    الكلمة الإنجليزية
                  </label>
                  <input
                    type="text"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/20 dark:bg-gray-800/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="English word"
                  />
                  {wordError && (
                    <p className="text-red-500 text-sm mt-1">{wordError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-200 font-bold mb-2">
                    المعنى بالعربية
                  </label>
                  <input
                    type="text"
                    value={newMeaning}
                    onChange={(e) => setNewMeaning(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/20 dark:bg-gray-800/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="المعنى بالعربية"
                  />
                  {meaningError && (
                    <p className="text-red-500 text-sm mt-1">{meaningError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold text-lg shadow-xl hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300"
                >
                  إضافة الكلمة
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyWordsPage;
