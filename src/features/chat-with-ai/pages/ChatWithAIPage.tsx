import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../core/providers/AuthProvider";
import {
  sendChatMessage,
  getChatHistory,
  learnWord,
  getChatRemainingRequests,
} from "../../../core/utils/api";
import { Loading } from "../../../presentation/components";

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: string;
  type: string;
}

const ChatWithAIPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unknownWords, setUnknownWords] = useState<any[]>([]);
  const [selectedWord, setSelectedWord] = useState<any>(null);
  const [learnedWords, setLearnedWords] = useState<any[]>([]);
  const [remainingRequests, setRemainingRequests] = useState<number>(5);
  const [isLoadingRemaining, setIsLoadingRemaining] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [currentSentence, setCurrentSentence] = useState<string>("");
  const [userResponse, setUserResponse] = useState<string>("");
  const [showResponseButtons, setShowResponseButtons] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [selectedWordInfo, setSelectedWordInfo] = useState<any>(null);
  const [showWordInfo, setShowWordInfo] = useState(false);

  // دالة تحسين تنسيق النص
  const formatMessageText = (text: string) => {
    // تقسيم النص إلى فقرات
    const paragraphs = text.split("\n\n").filter((p) => p.trim());

    return paragraphs.map((paragraph, index) => {
      // تنظيف الفقرة
      let cleanParagraph = paragraph.trim();

      // تحسين العناوين (النص الذي يبدأ بأرقام أو نقاط)
      if (cleanParagraph.match(/^[\d-•*]\./)) {
        return (
          <div key={index} className="mb-3">
            <div className="font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <span className="leading-relaxed">{cleanParagraph}</span>
            </div>
          </div>
        );
      }

      // معالجة الجمل الإنجليزية - تمييزها بلون مختلف وخط مختلف
      const processEnglishSentences = (text: string) => {
        const parts = text.split(/([A-Z][^.!?]*[.!?])/g);
        return parts.map((part, i) => {
          if (part.match(/^[A-Z][^.!?]*[.!?]$/)) {
            return (
              <span
                key={i}
                className="inline-block bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-2 py-1 rounded-md mx-1 my-0.5 font-medium text-blue-800 dark:text-blue-200 border border-blue-200/50 dark:border-blue-700/50"
                style={{ fontFamily: "'Inter', 'SF Pro Display', sans-serif" }}
              >
                {part.trim()}
              </span>
            );
          }
          return part;
        });
      };

      // معالجة النص العادي
      if (
        cleanParagraph.includes("🌟") ||
        cleanParagraph.includes("🎉") ||
        cleanParagraph.includes("✅")
      ) {
        return (
          <div
            key={index}
            className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200/50 dark:border-green-700/50"
          >
            <div className="text-green-800 dark:text-green-200 leading-relaxed font-medium">
              {processEnglishSentences(cleanParagraph)}
            </div>
          </div>
        );
      }

      // معالجة النص التحذيري
      if (cleanParagraph.includes("⚠️") || cleanParagraph.includes("عذراً")) {
        return (
          <div
            key={index}
            className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg border border-red-200/50 dark:border-red-700/50"
          >
            <div className="text-red-800 dark:text-red-200 leading-relaxed font-medium">
              {processEnglishSentences(cleanParagraph)}
            </div>
          </div>
        );
      }

      // النص العادي مع تحسينات
      return (
        <div key={index} className="mb-3">
          <div className="leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
            {processEnglishSentences(cleanParagraph)}
          </div>
        </div>
      );
    });
  };

  // جلب الكلمات المجهولة من localStorage فقط
  useEffect(() => {
    const stored = localStorage.getItem("unknownWords");
    setUnknownWords(stored ? JSON.parse(stored) : []);

    // رسالة ترحيب محسنة
    setMessages([
      {
        id: "welcome",
        message: "مرحباً",
        response: `مرحباً بك في تطبيق تعلم الكلمات مع الذكاء الاصطناعي! 🌟

أهلاً وسهلاً بك في رحلة تعلم ممتعة وتفاعلية. يمكنك الاستفادة من المميزات التالية:

• اختيار أي كلمة من القائمة الجانبية للحصول على شرح مفصل
• طرح أي سؤال تريده حول اللغة الإنجليزية
• الاستماع للنطق الصحيح للجمل الإنجليزية
• تعلم الكلمات وحفظها في قائمتك الشخصية${
          stored && JSON.parse(stored).length
            ? `\n\n📚 لديك ${
                JSON.parse(stored).length
              } كلمات جديدة تنتظر التعلم!`
            : ""
        }

كيف يمكنني مساعدتك اليوم؟ 😊`,
        timestamp: new Date().toISOString(),
        type: "system",
      },
    ]);
  }, []);

  // جلب الطلبات المتبقية مع loading screen
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsPageLoading(true);
      setIsLoadingRemaining(true);

      try {
        // جلب الطلبات المتبقية
        const response = await getChatRemainingRequests();
        if (response.success && response.data) {
          const remaining = (response.data as any).remaining;
          setRemainingRequests(remaining);

          // إظهار رسالة إذا كانت الطلبات المتبقية صفراً
          if (remaining <= 0) {
            const limitMessage = {
              id: "limit-notice",
              message: "",
              response:
                "⚠️ لقد استخدمت جميع طلبات الدردشة اليومية\n\nلا تقلق! يمكنك إرسال رسائل جديدة غداً والاستمرار في رحلة التعلم. استغل هذا الوقت لمراجعة الكلمات التي تعلمتها اليوم.",
              timestamp: new Date().toISOString(),
              type: "error",
            };
            setMessages((prev) => {
              // تجنب إضافة الرسالة إذا كانت موجودة بالفعل
              if (prev.some((msg) => msg.id === "limit-notice")) {
                return prev;
              }
              return [...prev, limitMessage];
            });
          }
        }
      } catch (error) {
        console.error("خطأ في جلب الطلبات المتبقية:", error);
      } finally {
        setIsLoadingRemaining(false);
        setIsPageLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // التمرير التلقائي للأسفل
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // فحص الطلبات المتبقية قبل الإرسال
    if (remainingRequests <= 0) {
      const limitMessage = {
        id: Date.now().toString(),
        message: message,
        response:
          "⚠️ لقد استخدمت جميع طلبات الدردشة اليومية\n\nعذراً، لقد وصلت إلى الحد الأقصى من الرسائل لهذا اليوم. يمكنك العودة غداً لمتابعة رحلة التعلم. في هذه الأثناء، يمكنك مراجعة الكلمات التي تعلمتها سابقاً.",
        timestamp: new Date().toISOString(),
        type: "error",
      };
      setMessages((prev) => [...prev, limitMessage]);
      setInputMessage("");
      return;
    }

    setIsLoading(true);
    const userMessage = {
      id: Date.now().toString(),
      message: message,
      response: "",
      timestamp: new Date().toISOString(),
      type: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    try {
      const response = await sendChatMessage({
        message: message,
        type: "text",
        language: "Arabic",
        context: selectedWord
          ? `الكلمة: ${selectedWord.word || selectedWord.english} - المعنى: ${
              selectedWord.meaning
            }`
          : "general",
      });

      if (response.success && response.data) {
        const responseData = response.data as any;

        // فحص إذا كانت الرسالة تحتوي على خطأ في الفهم
        const isErrorResponse =
          responseData.response &&
          (responseData.response.includes("عذراً، لم أستطع فهم") ||
            responseData.response.includes("لم أستطع فهم") ||
            responseData.response.includes("يرجى المحاولة مرة أخرى"));

        const aiMessage = {
          id: responseData.messageId || Date.now().toString(),
          message: message,
          response:
            responseData.response ||
            "عذراً، لم أستطع فهم رسالتك بوضوح. يرجى إعادة صياغة السؤال أو المحاولة مرة أخرى.\n\nيمكنك أيضاً استخدام الأزرار السريعة أسفل نافذة الدردشة للحصول على اقتراحات مفيدة.",
          timestamp: responseData.timestamp || new Date().toISOString(),
          type: isErrorResponse ? "error" : "ai",
        };
        setMessages((prev) => [...prev, aiMessage]);

        // فحص إذا كانت الرسالة تحتوي على سؤال عن التعلم
        if (
          responseData.response &&
          responseData.response.includes("هل تريد") &&
          responseData.response.includes("تعلم")
        ) {
          setShowResponseButtons(true);
        }

        // تحديث عدد الطلبات المتبقية فقط إذا لم تكن رسالة خطأ
        if (!isErrorResponse) {
          setRemainingRequests((prev) => Math.max(0, prev - 1));

          // تحديث الطلبات المتبقية من الخادم
          try {
            const remainingResponse = await getChatRemainingRequests();
            if (remainingResponse.success && remainingResponse.data) {
              const remaining = (remainingResponse.data as any).remaining;
              setRemainingRequests(remaining);
            }
          } catch (error) {
            console.error("خطأ في تحديث الطلبات المتبقية:", error);
          }
        }
      } else {
        // رسالة خطأ
        const errorMessage = {
          id: Date.now().toString(),
          message: message,
          response:
            "⚠️ حدث خطأ في الاتصال\n\nعذراً، واجهنا مشكلة تقنية مؤقتة في الخادم. يرجى المحاولة مرة أخرى خلال بضع دقائق.\n\nإذا استمرت المشكلة، تأكد من اتصالك بالإنترنت أو اتصل بفريق الدعم.",
          timestamp: new Date().toISOString(),
          type: "error",
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now().toString(),
        message: message,
        response:
          "⚠️ خطأ في الشبكة\n\nيبدو أن هناك مشكلة في الاتصال بالإنترنت. يرجى:\n\n• التأكد من اتصالك بالإنترنت\n• إعادة تحميل الصفحة\n• المحاولة مرة أخرى خلال بضع دقائق",
        timestamp: new Date().toISOString(),
        type: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordSelect = (word: any) => {
    if (remainingRequests <= 0) {
      const limitMessage = {
        id: Date.now().toString(),
        message: `أريد تعلم كلمة "${word.word || word.english}"`,
        response:
          "⚠️ لقد استخدمت جميع طلبات الدردشة اليومية. يمكنك إرسال رسائل جديدة غداً.",
        timestamp: new Date().toISOString(),
        type: "error",
      };
      setMessages((prev) => [...prev, limitMessage]);
      return;
    }

    setSelectedWord(word);
    const message = `أريد تعلم كلمة "${word.word || word.english}" التي تعني "${
      word.meaning
    }". هل يمكنك مساعدتي في فهمها بشكل أفضل وإنشاء جمل مفيدة؟`;
    handleSendMessage(message);
  };

  const handleLearnWord = async (word: any) => {
    // فحص إذا كانت الكلمة متعلمة بالفعل
    const isAlreadyLearned = learnedWords.some(
      (w: any) =>
        (w.id || w.word || w.english) === (word.id || word.word || word.english)
    );

    if (isAlreadyLearned) {
      const alreadyMessage = {
        id: Date.now().toString(),
        message: `كلمة "${word.word || word.english}"`,
        response: `✅ هذه الكلمة متعلمة بالفعل!\n\nرائع! لقد أضفت هذه الكلمة إلى قائمة الكلمات المتعلمة من قبل. استمر في التعلم والممارسة!`,
        timestamp: new Date().toISOString(),
        type: "system",
      };
      setMessages((prev) => [...prev, alreadyMessage]);
      return;
    }

    try {
      await learnWord(word.word || word.english || word.id);
      // إزالة الكلمة من قائمة الكلمات المجهولة في localStorage
      let arr = unknownWords.filter(
        (w: any) =>
          (w.id || w.word || w.english) !==
          (word.id || word.word || word.english)
      );
      setUnknownWords(arr);
      localStorage.setItem("unknownWords", JSON.stringify(arr));
      setLearnedWords((prev) => [...prev, word]);

      // تحديث الطلبات المتبقية من الخادم
      try {
        const remainingResponse = await getChatRemainingRequests();
        if (remainingResponse.success && remainingResponse.data) {
          const remaining = (remainingResponse.data as any).remaining;
          setRemainingRequests(remaining);
        }
      } catch (error) {
        console.error("خطأ في تحديث الطلبات المتبقية:", error);
      }

      // رسالة تأكيد محسنة
      const confirmMessage = {
        id: Date.now().toString(),
        message: `تم تعلم كلمة "${word.word || word.english}"`,
        response: `🎉 تهانينا! تم حفظ الكلمة بنجاح\n\nلقد أضفت كلمة "${
          word.word || word.english
        }" إلى قائمة الكلمات المتعلمة. أصبح لديك الآن ${
          learnedWords.length + 1
        } كلمة متعلمة!\n\n💡 نصيحة: استمر في استخدام هذه الكلمة في جمل مختلفة لترسيخها في ذاكرتك.`,
        timestamp: new Date().toISOString(),
        type: "system",
      };
      setMessages((prev) => [...prev, confirmMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now().toString(),
        message: `خطأ في تعلم كلمة "${word.word || word.english}"`,
        response: "عذراً، حدث خطأ في حفظ الكلمة. يرجى المحاولة مرة أخرى.",
        timestamp: new Date().toISOString(),
        type: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleQuickQuestions = (question: string) => {
    if (remainingRequests <= 0) {
      const limitMessage = {
        id: Date.now().toString(),
        message: question,
        response:
          "⚠️ لقد استخدمت جميع طلبات الدردشة اليومية. يمكنك إرسال رسائل جديدة غداً.",
        timestamp: new Date().toISOString(),
        type: "error",
      };
      setMessages((prev) => [...prev, limitMessage]);
      return;
    }

    // إضافة رسالة فورية للمستخدم
    const userMessage = {
      id: Date.now().toString(),
      message: question,
      response: "",
      timestamp: new Date().toISOString(),
      type: "user",
    };
    setMessages((prev) => [...prev, userMessage]);

    // إرسال الطلب للـ AI
    handleSendMessage(question);
  };

  // دالة قراءة الجمل الإنجليزية فقط
  const handleReadSentence = (sentence: string) => {
    // استخراج الجمل الإنجليزية الفردية (تبدأ بحرف كبير وتنتهي بنقطة)
    const englishSentences = sentence.match(/[A-Z][^.!?]*[.!?]/g) || [];

    if (englishSentences.length === 0) {
      return; // لا توجد جمل إنجليزية
    }

    if ("speechSynthesis" in window) {
      setIsReading(true);
      setCurrentSentence(sentence);

      // قراءة الجمل الإنجليزية فقط، مفصولة بفواصل
      const cleanSentences = englishSentences.map((s) => s.trim()).join(". ");
      const utterance = new SpeechSynthesisUtterance(cleanSentences);
      utterance.lang = "en-US";
      utterance.rate = 0.8;
      utterance.pitch = 1;

      utterance.onend = () => {
        setIsReading(false);
        setCurrentSentence("");
      };

      utterance.onerror = () => {
        setIsReading(false);
        setCurrentSentence("");
      };

      speechSynthesis.speak(utterance);
    } else {
      alert("متصفحك لا يدعم قراءة النصوص");
    }
  };

  // دالة إيقاف القراءة
  const handleStopReading = () => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      setIsReading(false);
      setCurrentSentence("");
    }
  };

  // دالة التعامل مع رد المستخدم
  const handleUserResponse = (response: string) => {
    setUserResponse(response);
    setShowResponseButtons(false);

    if (response === "نعم") {
      // إذا قال نعم، أرسل رسالة لطلب جمل جديدة
      handleSendMessage("أعطني جمل جديدة مفيدة");
    } else if (response === "لا") {
      // إذا قال لا، أرسل رسالة شكر
      const thankMessage = {
        id: Date.now().toString(),
        message: "شكراً لك",
        response:
          "شكراً لك على وقتك! 😊\n\nإذا احتجت مساعدة في أي وقت آخر، لا تتردد في السؤال. أنا هنا لمساعدتك في رحلة تعلم اللغة الإنجليزية.\n\nتذكر: الممارسة المستمرة هي مفتاح النجاح في تعلم أي لغة!",
        timestamp: new Date().toISOString(),
        type: "system",
      };
      setMessages((prev) => [...prev, thankMessage]);
    }
  };

  // دالة عرض معلومات الكلمة المحددة
  const handleShowWordInfo = (word: any) => {
    setSelectedWordInfo(word);
    setShowWordInfo(true);
  };

  // دالة إغلاق معلومات الكلمة
  const handleCloseWordInfo = () => {
    setShowWordInfo(false);
    setSelectedWordInfo(null);
  };

  // Loading Screen
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
            جاري تحميل البيانات...
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            يرجى الانتظار قليلاً ✨
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg shadow-lg border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  دردشة مع الذكاء الاصطناعي
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  تعلم الكلمات الجديدة بطريقة تفاعلية وممتعة 🚀
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-sm font-bold shadow-lg">
                {isLoadingRemaining ? "..." : remainingRequests} طلبات متبقية
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  كلمات مجهولة
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {unknownWords.length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl shadow-lg">
                <svg
                  className="w-7 h-7 text-blue-600 dark:text-blue-400"
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
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  كلمات متعلمة
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {learnedWords.length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl shadow-lg">
                <svg
                  className="w-7 h-7 text-green-600 dark:text-green-400"
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
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  رسائل المحادثة
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {messages.length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl shadow-lg">
                <svg
                  className="w-7 h-7 text-purple-600 dark:text-purple-400"
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
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  طلبات متبقية
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {isLoadingRemaining ? "..." : remainingRequests}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl shadow-lg">
                <svg
                  className="w-7 h-7 text-orange-600 dark:text-orange-400"
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
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Unknown Words */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  الكلمات المجهولة
                </h3>
              </div>
              <div className="p-4">
                {unknownWords.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg
                        className="w-6 h-6 text-green-600 dark:text-green-400"
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
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      لا توجد كلمات مجهولة!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {unknownWords.map((word, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border transition-all duration-200 ${
                          selectedWord?.id === word.id
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
                            : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-slate-800 dark:text-white text-sm">
                              {word.word || word.english}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {word.meaning}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleShowWordInfo(word)}
                            className="px-2 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                          >
                            <svg
                              className="w-3 h-3"
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
                          </button>
                          <button
                            onClick={() => handleWordSelect(word)}
                            disabled={remainingRequests <= 0 || isLoading}
                            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              remainingRequests <= 0 || isLoading
                                ? "bg-slate-100 dark:bg-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                          >
                            {isLoading ? "جاري..." : "اسأل AI"}
                          </button>
                          <button
                            onClick={() => handleLearnWord(word)}
                            disabled={learnedWords.some(
                              (w: any) =>
                                (w.id || w.word || w.english) ===
                                (word.id || word.word || word.english)
                            )}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              learnedWords.some(
                                (w: any) =>
                                  (w.id || w.word || w.english) ===
                                  (word.id || word.word || word.english)
                              )
                                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-700 text-white"
                            }`}
                          >
                            {learnedWords.some(
                              (w: any) =>
                                (w.id || w.word || w.english) ===
                                (word.id || word.word || word.english)
                            )
                              ? "متعلّمة"
                              : "تعلمها"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Learned Words */}
            {learnedWords.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    الكلمات المتعلمة
                  </h3>
                </div>
                <div className="p-4 space-y-2">
                  {learnedWords.map((word, index) => (
                    <div
                      key={index}
                      className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg"
                    >
                      <p className="font-medium text-green-800 dark:text-green-200 text-sm">
                        {word.word || word.english}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                        {word.meaning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-[600px] flex flex-col relative">
              {/* Background Logo - Clearer and More Visible */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                <div
                  className="w-full h-full bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 dark:from-slate-700 dark:via-slate-800 dark:to-purple-800 absolute inset-0 rounded-xl"
                  style={{ filter: "blur(4px)", opacity: 0.6 }}
                ></div>
                <div className="relative z-10 flex flex-col items-center">
                  <img
                    src="/logo.png"
                    alt="logo"
                    className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain drop-shadow-2xl"
                    style={{ opacity: 0.95 }}
                  />
                  <p className="mt-2 text-xl font-bold text-orange-500 dark:text-orange-400 flex items-center gap-1">
                    LetSpeak
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.type === "user"
                          ? "bg-blue-600 text-white"
                          : msg.type === "error"
                          ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {msg.type === "user" ? (
                        <p className="text-sm">{msg.message}</p>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-sm leading-relaxed">
                            {formatMessageText(msg.response)}
                          </div>
                          {msg.type === "ai" &&
                            msg.response &&
                            msg.response.match(/[A-Z][^.!?]*[.!?]/g) && (
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() =>
                                    handleReadSentence(msg.response)
                                  }
                                  disabled={isReading}
                                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                    isReading &&
                                    currentSentence === msg.response
                                      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                                  }`}
                                >
                                  {isReading &&
                                  currentSentence === msg.response ? (
                                    <span className="flex items-center gap-1">
                                      <svg
                                        className="w-3 h-3 animate-pulse"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      إيقاف
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <svg
                                        className="w-3 h-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      استمع للجمل الإنجليزية
                                    </span>
                                  )}
                                </button>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />

                {/* أزرار الرد */}
                {showResponseButtons && (
                  <div className="flex justify-center gap-3 p-4">
                    <button
                      onClick={() => handleUserResponse("نعم")}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      نعم
                    </button>
                    <button
                      onClick={() => handleUserResponse("لا")}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                      لا
                    </button>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 relative z-10">
                {remainingRequests <= 0 ? (
                  <div className="text-center py-4">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                      <p className="text-red-700 dark:text-red-300 text-sm">
                        ⚠️ لقد استخدمت جميع طلبات الدردشة اليومية. يمكنك إرسال
                        رسائل جديدة غداً.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSendMessage(inputMessage)
                        }
                        placeholder="اكتب رسالتك هنا..."
                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                      />
                      <button
                        onClick={() => handleSendMessage(inputMessage)}
                        disabled={!inputMessage.trim() || isLoading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                      >
                        {isLoading ? (
                          <Loading size="xl" variant="video" text="جاري التحميل..." />    
                        ) : (
                          "إرسال"
                        )}
                      </button>
                    </div>

                    {/* أزرار إضافية */}
                    <div className="flex gap-2">
                      {isReading && (
                        <button
                          onClick={handleStopReading}
                          className="flex-1 px-4 py-2 text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <svg
                              className="w-4 h-4 animate-pulse"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                            إيقاف القراءة
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal معلومات الكلمة المحددة */}
      {showWordInfo && selectedWordInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  معلومات الكلمة
                </h3>
                <button
                  onClick={handleCloseWordInfo}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-slate-600 dark:text-slate-300"
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
              </div>

              <div className="space-y-4">
                {/* الكلمة الإنجليزية */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400"
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
                    <span className="font-semibold text-blue-800 dark:text-blue-200">
                      الكلمة الإنجليزية
                    </span>
                  </div>
                  <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                    {selectedWordInfo.word || selectedWordInfo.english}
                  </p>
                </div>

                {/* المعنى العربي */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                      />
                    </svg>
                    <span className="font-semibold text-green-800 dark:text-green-200">
                      المعنى العربي
                    </span>
                  </div>
                  <p className="text-lg text-green-900 dark:text-green-100 leading-relaxed">
                    {selectedWordInfo.meaning}
                  </p>
                </div>

                {/* معلومات إضافية */}
                {selectedWordInfo.pronunciation && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-5 h-5 text-purple-600 dark:text-purple-400"
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
                      <span className="font-semibold text-purple-800 dark:text-purple-200">
                        النطق
                      </span>
                    </div>
                    <p className="text-lg text-purple-900 dark:text-purple-100">
                      {selectedWordInfo.pronunciation}
                    </p>
                  </div>
                )}

                {selectedWordInfo.type && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-5 h-5 text-orange-600 dark:text-orange-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      <span className="font-semibold text-orange-800 dark:text-orange-200">
                        نوع الكلمة
                      </span>
                    </div>
                    <p className="text-lg text-orange-900 dark:text-orange-100">
                      {selectedWordInfo.type}
                    </p>
                  </div>
                )}
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    handleCloseWordInfo();
                    handleWordSelect(selectedWordInfo);
                  }}
                  disabled={remainingRequests <= 0 || isLoading}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    remainingRequests <= 0 || isLoading
                      ? "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                    {isLoading ? <Loading size="xl" variant="video" text="جاري التحميل..." />  : "اسأل AI"}
                </button>
                <button
                  onClick={() => {
                    handleCloseWordInfo();
                    handleLearnWord(selectedWordInfo);
                  }}
                  disabled={learnedWords.some(
                    (w: any) =>
                      (w.id || w.word || w.english) ===
                      (selectedWordInfo.id ||
                        selectedWordInfo.word ||
                        selectedWordInfo.english)
                  )}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    learnedWords.some(
                      (w: any) =>
                        (w.id || w.word || w.english) ===
                        (selectedWordInfo.id ||
                          selectedWordInfo.word ||
                          selectedWordInfo.english)
                    )
                      ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {learnedWords.some(
                    (w: any) =>
                      (w.id || w.word || w.english) ===
                      (selectedWordInfo.id ||
                        selectedWordInfo.word ||
                        selectedWordInfo.english)
                  )
                    ? "متعلّمة"
                    : "تعلمها"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWithAIPage;
