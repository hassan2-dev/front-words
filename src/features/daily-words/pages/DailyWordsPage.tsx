import React, { useState, useEffect } from "react";
import { useAuth } from "../../../core/providers/AuthProvider";
import {
  getDailyWords,
  learnWord,
  getLearnedWords,
  addWord,
  completeDailyWords,
  addPrivateWordsAchievement,
  getPrivateWords,
} from "../../../core/utils/api";
import { useLocation, useNavigate } from "react-router-dom";

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
  const [tab, setTab] = useState<"daily" | "learned" | "private">("daily");
  const [learnedWords, setLearnedWords] = useState<any[] | null>(null);
  const [privateWords, setPrivateWords] = useState<any[] | null>(null);
  const [loadingTab, setLoadingTab] = useState(false);

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
      if (res.success && Array.isArray(res.data)) {
        // استخدام الكلمات الجديدة من API مباشرة
        const today = new Date().toISOString().split("T")[0];
        const lastFetchDate = localStorage.getItem("lastFetchDate");

        // إذا كان اليوم مختلف، جلب كلمات جديدة
        if (lastFetchDate !== today) {
          // مسح البيانات القديمة عند بداية يوم جديد
          localStorage.removeItem("unknownWords");

          const newWords = res.data.map((word: any, idx: number) => ({
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
          const allWords = res.data.map((word: any, idx: number) => ({
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
  }, [dailyWordsBlocked]);

  // جلب الكلمات المتعلمة عند الحاجة
  const fetchLearnedWords = async () => {
    setLoadingTab(true);
    const res = await getLearnedWords();
    console.log("LearnedWords API result:", res);
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
    setLoadingTab(false);
  };

  // جلب كلمات الطالب الخاصة عند الحاجة
  const fetchPrivateWords = async () => {
    setLoadingTab(true);
    const res = await getPrivateWords();
    if (res.success && Array.isArray(res.data)) {
      setPrivateWords(res.data);
    } else {
      setPrivateWords([]);
    }
    setLoadingTab(false);
  };

  // عند تغيير التبويب
  useEffect(() => {
    if (tab === "learned" && learnedWords === null) fetchLearnedWords();
    if (tab === "private" && privateWords === null) fetchPrivateWords();
    // لا شيء عند daily
    // eslint-disable-next-line
  }, [tab]);

  const currentWord = words[currentWordIndex];
  const learnedCount = words.filter((word) => word.isLearned).length;

  const nextWord = () => {
    if (currentWordIndex < words.length - 1) {
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
      await fetchLearnedWords();
    } catch (error) {
      // يمكن إضافة رسالة خطأ هنا إذا لزم الأمر
    }
  };

  // أعلى الكومبوننت:
  const [wordError, setWordError] = useState("");
  const [meaningError, setMeaningError] = useState("");

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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden flex items-center justify-center">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-ping"></div>
          <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-ping delay-500"></div>
        </div>

        <div className="text-center relative z-10">
          {/* Enhanced loading spinner */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 border-r-purple-400 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-pink-400 border-l-indigo-400 animate-spin animate-reverse"></div>
          </div>

          <div className="space-y-4">
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              جاري تحميل الكلمات...
            </p>
            <p className="text-xl text-gray-300">يرجى الانتظار قليلاً ✨</p>
            <div className="flex justify-center space-x-2 mt-6">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100/30 via-transparent to-transparent dark:from-blue-900/10"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-100/30 via-transparent to-transparent dark:from-indigo-900/10"></div>
      </div>

      <div className="w-full h-full px-0 py-0 relative z-10">
        {/* Enhanced Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden group">
                <svg
                  className="w-6 h-6 text-white transform group-hover:scale-110 transition-transform duration-300"
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
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white mb-1">
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
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 flex items-center gap-2 group transform hover:scale-105"
              >
                <span className="text-lg group-hover:rotate-90 transition-transform duration-300">
                  ＋
                </span>
                <span>أضف كلمة خاصة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-gray-200 dark:border-gray-700">
            <button
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 focus:outline-none ${
                tab === "daily"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => setTab("daily")}
            >
              <span>الكلمات اليومية</span>
              {words.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                  {words.length}
                </span>
              )}
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 focus:outline-none ${
                tab === "learned"
                  ? "bg-green-600 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => setTab("learned")}
            >
              <span>الكلمات المتعلمة</span>
              {learnedWords && learnedWords.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                  {learnedWords.length}
                </span>
              )}
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 focus:outline-none ${
                tab === "private"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => setTab("private")}
            >
              <span>كلماتي الخاصة</span>
              {privateWords && privateWords.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                  {privateWords.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* محتوى التبويب */}
        {tab === "daily" && (
          <>
            {/* Enhanced empty state */}
            {!words.length && (
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
            {words.length === 0 && unknownWords.length === 0 && (
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
            {words.length === 0 && unknownWords.length > 0 && (
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
                    🎯 لديك {unknownWords.length} كلمة تحتاج تعلمها
                  </h3>
                  <p className="text-white/90 text-lg mb-6">
                    لقد انتهيت من جميع الكلمات! الآن دعنا نتعلم الكلمات المجهولة
                    مع الذكاء الاصطناعي
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

            {words.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Enhanced Progress Card - Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        التقدم اليومي
                      </h2>
                    </div>
                    <div className="text-center mb-4">
                      <div className="relative inline-flex items-center justify-center w-24 h-24 mb-3">
                        <svg
                          className="w-24 h-24 transform -rotate-90"
                          viewBox="0 0 120 120"
                        >
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke="rgba(156, 163, 175, 0.3)"
                            strokeWidth="6"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${
                              (learnedCount / words.length) * 314
                            } 314`}
                            style={{
                              transition: "stroke-dasharray 0.5s ease",
                            }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {Math.round((learnedCount / words.length) * 100)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {learnedCount}
                        </span>{" "}
                        من{" "}
                        <span className="font-bold text-gray-800 dark:text-white">
                          {words.length}
                        </span>{" "}
                        كلمة
                      </p>
                    </div>
                    {/* Enhanced word indicators */}
                    <div className="grid grid-cols-5 gap-1">
                      {words.map((word, index) => (
                        <button
                          key={
                            (word.id || word.word || word.english) + "-" + index
                          }
                          onClick={() => {
                            setCurrentWordIndex(index);
                            setShowAnswer(false);
                          }}
                          className={`w-full h-8 rounded-lg transition-all duration-300 text-xs font-bold border ${
                            index === currentWordIndex
                              ? "bg-blue-600 text-white border-blue-500 shadow-md"
                              : word.isLearned
                              ? "bg-green-600 text-white border-green-500"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                          title={`كلمة ${index + 1}`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Statistics */}
                  <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      إحصائيات سريعة
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">
                          الكلمات المتعلمة
                        </span>
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          {learnedCount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">
                          الكلمات المتبقية
                        </span>
                        <span className="text-orange-600 dark:text-orange-400 font-bold">
                          {words.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">
                          إجمالي الكلمات
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                          {words.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">
                          الكلمات المجهولة
                        </span>
                        <span className="text-purple-600 dark:text-purple-400 font-bold">
                          {unknownWords.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Main Content */}
                <div className="lg:col-span-3">
                  {/* Enhanced Word Card */}
                  {currentWord && (
                    <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                      <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <button
                            onClick={prevWord}
                            disabled={currentWordIndex === 0}
                            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg flex items-center justify-center shadow-md transition-all duration-300 disabled:cursor-not-allowed"
                          >
                            <svg
                              className="w-5 h-5"
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

                          <div className="text-center">
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white mb-2">
                              {currentWord.word}
                            </h2>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => speakWord(currentWord.word)}
                                className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center shadow-md transition-all duration-300"
                                title="نطق الكلمة"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                                  />
                                </svg>
                              </button>
                              <span className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                                {currentWordIndex + 1} من {words.length}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={nextWord}
                            disabled={currentWordIndex === words.length - 1}
                            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg flex items-center justify-center shadow-md transition-all duration-300 disabled:cursor-not-allowed"
                          >
                            <svg
                              className="w-5 h-5"
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

                        {!showAnswer ? (
                          <button
                            onClick={() => setShowAnswer(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300"
                          >
                            عرض المعنى ✨
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                              <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-2 flex items-center justify-center gap-2">
                                <span>💡</span>
                                المعنى
                              </h3>
                              <p className="text-lg text-gray-700 dark:text-gray-200 font-medium">
                                {currentWord.meaning}
                              </p>
                            </div>
                            <div className="flex gap-3 justify-center">
                              <button
                                onClick={async () => {
                                  await learnWord(
                                    currentWord.word ||
                                      currentWord.english ||
                                      currentWord.id
                                  );

                                  // إزالة الكلمة من قائمة الكلمات المجهولة إذا كانت موجودة
                                  const stored =
                                    localStorage.getItem("unknownWords");
                                  let arr = stored ? JSON.parse(stored) : [];
                                  const key =
                                    currentWord.id ||
                                    currentWord.word ||
                                    currentWord.english;

                                  // إزالة الكلمة من unknownWords
                                  arr = arr.filter(
                                    (w: any) =>
                                      (w.id || w.word || w.english) !== key
                                  );
                                  localStorage.setItem(
                                    "unknownWords",
                                    JSON.stringify(arr)
                                  );

                                  // تحديث حالة الكلمة بدلاً من إزالتها
                                  setWords((prev) =>
                                    prev.map((word) =>
                                      word.id === currentWord.id
                                        ? { ...word, isLearned: true }
                                        : word
                                    )
                                  );

                                  // تحديث unknownWords state
                                  setUnknownWords(arr);

                                  // الانتقال للكلمة التالية
                                  if (currentWordIndex < words.length - 1) {
                                    setCurrentWordIndex(currentWordIndex + 1);
                                  } else {
                                    setCurrentWordIndex(0);
                                  }
                                  setShowAnswer(false);
                                }}
                                className="px-4 py-2 rounded-lg font-semibold transition-all duration-300 bg-green-600 hover:bg-green-700 text-white shadow-md"
                              >
                                أعرفها
                              </button>
                              <button
                                onClick={() => {
                                  // إضافة الكلمة إلى قائمة الكلمات المجهولة
                                  const stored =
                                    localStorage.getItem("unknownWords");
                                  let arr = stored ? JSON.parse(stored) : [];
                                  const key =
                                    currentWord.id ||
                                    currentWord.word ||
                                    currentWord.english;

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

                                  // تحديث حالة الكلمة بدلاً من إزالتها
                                  setWords((prev) =>
                                    prev.map((word) =>
                                      word.id === currentWord.id
                                        ? { ...word, isLearned: false }
                                        : word
                                    )
                                  );

                                  // تحديث unknownWords state
                                  setUnknownWords(arr);

                                  // الانتقال للكلمة التالية
                                  if (currentWordIndex < words.length - 1) {
                                    setCurrentWordIndex(currentWordIndex + 1);
                                  } else {
                                    setCurrentWordIndex(0);
                                  }
                                  setShowAnswer(false);
                                }}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-all duration-300 border border-gray-300 dark:border-gray-600"
                              >
                                لا أعرفها
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {tab === "learned" && (
          <>
            {/* Enhanced empty state for learned words */}
            {!learnedWords || learnedWords.length === 0 ? (
              <div className="mb-8 flex justify-center">
                <div className="max-w-lg bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 text-center border border-white/20">
                  <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
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
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-4">
                    لا توجد كلمات متعلمة
                  </h2>
                  <p className="text-gray-200 leading-relaxed text-lg">
                    لم يتم العثور على كلمات متعلمة. أضف كلمات جديدة لتبدأ في
                    التعلم.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {learnedWords
                    .slice(
                      (learnedPage - 1) * CARDS_PER_PAGE,
                      learnedPage * CARDS_PER_PAGE
                    )
                    .map((word, index) => (
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
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent mb-2 relative z-10">
                          {word.english || word.word}
                        </h3>
                        <p className="text-gray-200 text-lg mb-4 relative z-10">
                          {word.meaning || word.arabic}
                        </p>
                        <button
                          onClick={() => speakWord(word.english || word.word)}
                          className="mt-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-6 rounded-xl shadow-2xl transition-all duration-300 relative z-10 transform hover:scale-105"
                        >
                          نطق الكلمة 🔊
                        </button>
                      </div>
                    ))}
                </div>

                {/* Enhanced Pagination */}
                {learnedWords.length > CARDS_PER_PAGE && (
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
                      {Math.ceil(learnedWords.length / CARDS_PER_PAGE)}
                    </span>
                    <button
                      onClick={() =>
                        setLearnedPage((p) =>
                          Math.min(
                            Math.ceil(learnedWords.length / CARDS_PER_PAGE),
                            p + 1
                          )
                        )
                      }
                      disabled={
                        learnedPage ===
                        Math.ceil(learnedWords.length / CARDS_PER_PAGE)
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

        {tab === "private" && (
          <>
            {/* Enhanced empty state for private words */}
            {!privateWords || privateWords.length === 0 ? (
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
                  {privateWords
                    .slice(
                      (privatePage - 1) * CARDS_PER_PAGE,
                      privatePage * CARDS_PER_PAGE
                    )
                    .map((word, index) => (
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
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-2 relative z-10">
                          {word.english || word.word}
                        </h3>
                        <p className="text-gray-200 text-lg mb-4 relative z-10">
                          {word.meaning || word.arabic}
                        </p>
                        <button
                          onClick={() => speakWord(word.english || word.word)}
                          className="mt-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-6 rounded-xl shadow-2xl transition-all duration-300 relative z-10 transform hover:scale-105"
                        >
                          نطق الكلمة 🔊
                        </button>
                      </div>
                    ))}
                </div>

                {/* Enhanced Pagination */}
                {privateWords.length > CARDS_PER_PAGE && (
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
                      {Math.ceil(privateWords.length / CARDS_PER_PAGE)}
                    </span>
                    <button
                      onClick={() =>
                        setPrivatePage((p) =>
                          Math.min(
                            Math.ceil(privateWords.length / CARDS_PER_PAGE),
                            p + 1
                          )
                        )
                      }
                      disabled={
                        privatePage ===
                        Math.ceil(privateWords.length / CARDS_PER_PAGE)
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
