/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDailyStory,
  canProceedToNextStep,
  updateWordStatus,
  completeDailyStory,
  submitDailyExam,
} from "@/core/utils/api";
import type { DailyStory, DailyStoryWord } from "@/core/types";

interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface DailyStoryExamProps {
  onComplete: () => void;
  onClose: () => void;
}

export const DailyStoryExam: React.FC<DailyStoryExamProps> = ({
  onComplete,
  onClose,
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<"story" | "exam" | "complete">(
    "story"
  );
  const [story, setStory] = useState<DailyStory | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [examCompleted, setExamCompleted] = useState(false);
  const [score, setScore] = useState(0);

  // جلب القصة اليومية
  useEffect(() => {
    const fetchDailyStory = async () => {
      try {
        setLoading(true);
        const response = await getDailyStory();
        if (response.success && response.data) {
          const storyData = response.data as unknown as DailyStory;
          setStory(storyData);

          // إنشاء أسئلة الامتحان من الكلمات اليومية
          const dailyWords = storyData.words.filter((word) => word.isDailyWord);
          const questions: ExamQuestion[] = dailyWords.map((word, index) => ({
            id: `q${index + 1}`,
            question: `ما معنى كلمة "${word.word}"؟`,
            options: [
              word.meaning,
              `معنى خاطئ 1`,
              `معنى خاطئ 2`,
              `معنى خاطئ 3`,
            ].sort(() => Math.random() - 0.5), // ترتيب عشوائي
            correctAnswer: word.meaning,
            explanation: `الكلمة "${word.word}" تعني "${word.meaning}"`,
          }));
          setExamQuestions(questions);
        }
      } catch (error) {
        console.error("Error fetching daily story:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyStory();
  }, []);

  const dailyWords = story?.words.filter((word) => word.isDailyWord) || [];
  const currentWord = dailyWords[currentWordIndex];
  const currentQuestion = examQuestions[currentQuestionIndex];

  const handleNextWord = () => {
    if (currentWordIndex < dailyWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setShowTranslation(false);
    } else {
      setCurrentStep("exam");
    }
  };

  const handlePreviousWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
      setShowTranslation(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // حساب النتيجة
      const correctAnswers = examQuestions.filter(
        (q) => selectedAnswers[q.id] === q.correctAnswer
      ).length;
      const finalScore = Math.round(
        (correctAnswers / examQuestions.length) * 100
      );
      setScore(finalScore);
      setExamCompleted(true);
      setCurrentStep("complete");
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // إرسال نتائج الامتحان
      if (story) {
        await submitDailyExam({
          storyId: story.id,
          answers: selectedAnswers,
          score: score,
          level: "L1", // يمكن تحديثه حسب مستوى المستخدم
          points: Math.round((score / 100) * dailyWords.length * 10) // 10 نقاط لكل كلمة
        });
      }

      // تسجيل التاريخ
      const now = new Date();
      const today =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0");
      localStorage.setItem("lastDailyStoryDate", today);

      onComplete();
    } catch (error) {
      console.error("Error completing daily story exam:", error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            جاري تحميل القصة اليومية...
          </p>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center">
          <div className="text-4xl mb-4">📖</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            لا توجد قصة اليوم
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            عذراً، لا توجد قصة متاحة اليوم. حاول مرة أخرى غداً.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">
              {currentStep === "story"
                ? "📖"
                : currentStep === "exam"
                ? "📝"
                : "🏆"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {currentStep === "story"
              ? "قصة اليوم"
              : currentStep === "exam"
              ? "امتحان اليوم"
              : "إكمال اليوم"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {new Date(story.date).toLocaleDateString("ar-SA")}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentStep === "story"
                ? "قراءة القصة"
                : currentStep === "exam"
                ? "الامتحان"
                : "الإكمال"}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentStep === "story"
                ? `${currentWordIndex + 1}/${dailyWords.length}`
                : currentStep === "exam"
                ? `${currentQuestionIndex + 1}/${examQuestions.length}`
                : "مكتمل"}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{
                width:
                  currentStep === "story"
                    ? `${((currentWordIndex + 1) / dailyWords.length) * 100}%`
                    : currentStep === "exam"
                    ? `${
                        ((currentQuestionIndex + 1) / examQuestions.length) *
                        100
                      }%`
                    : "100%",
              }}
            />
          </div>
        </div>

        {/* Story Step */}
        {currentStep === "story" && (
          <>
            {/* Story Content */}
            <div className="mb-8">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  {story.title}
                </h3>
                <div className="space-y-4">
                  <div className="text-gray-800 dark:text-gray-200 leading-relaxed">
                    {story.content}
                  </div>
                  <div className="border-t pt-4">
                    <div className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {story.translation}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Words Section */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
                الكلمات الجديدة اليوم ({currentWordIndex + 1} من{" "}
                {dailyWords.length})
              </h3>

              {currentWord && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-600">
                  <div className="text-center mb-4">
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {currentWord.word}
                    </span>
                  </div>

                  <div className="text-center mb-4">
                    <button
                      onClick={() => setShowTranslation(!showTranslation)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      {showTranslation ? "إخفاء المعنى" : "إظهار المعنى"}
                    </button>
                  </div>

                  {showTranslation && (
                    <div className="space-y-3">
                      <div className="text-center">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {currentWord.meaning}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <div className="text-gray-800 dark:text-gray-200 mb-2">
                          {currentWord.sentence}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 text-sm">
                          {currentWord.sentenceAr}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePreviousWord}
                disabled={currentWordIndex === 0}
                className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                السابق
              </button>

              <div className="flex gap-2">
                {dailyWords.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      index === currentWordIndex
                        ? "bg-blue-500"
                        : index < currentWordIndex
                        ? "bg-green-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNextWord}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                {currentWordIndex === dailyWords.length - 1
                  ? "ابدأ الامتحان"
                  : "التالي"}
              </button>
            </div>
          </>
        )}

        {/* Exam Step */}
        {currentStep === "exam" && currentQuestion && (
          <>
            <div className="mb-8">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-600">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                  السؤال {currentQuestionIndex + 1} من {examQuestions.length}
                </h3>

                <div className="mb-6">
                  <p className="text-lg text-gray-800 dark:text-gray-200 mb-4 text-center">
                    {currentQuestion.question}
                  </p>
                </div>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        handleAnswerSelect(currentQuestion.id, option)
                      }
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-right ${
                        selectedAnswers[currentQuestion.id] === option
                          ? "border-purple-500 bg-purple-100 dark:bg-purple-900/30"
                          : "border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600"
                      }`}
                    >
                      <span className="text-gray-800 dark:text-gray-200 font-medium">
                        {option}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                السابق
              </button>

              <div className="flex gap-2">
                {examQuestions.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      index === currentQuestionIndex
                        ? "bg-purple-500"
                        : selectedAnswers[examQuestions[index].id]
                        ? "bg-green-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNextQuestion}
                disabled={!selectedAnswers[currentQuestion.id]}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentQuestionIndex === examQuestions.length - 1
                  ? "إنهاء الامتحان"
                  : "التالي"}
              </button>
            </div>
          </>
        )}

        {/* Complete Step */}
        {currentStep === "complete" && (
          <>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-3xl">🏆</span>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                مبروك! أكملت اليوم بنجاح
              </h3>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-600">
                <div className="text-center mb-4">
                  <span className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {score}%
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {score >= 80
                    ? "أداء ممتاز! 🎉"
                    : score >= 60
                    ? "أداء جيد! 👍"
                    : "أداء مقبول، استمر في التعلم! 💪"}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      الكلمات الجديدة
                    </span>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {dailyWords.length}
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      الأسئلة الصحيحة
                    </span>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {Math.round((score / 100) * examQuestions.length)}/
                      {examQuestions.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleComplete}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold text-lg"
              >
                إكمال اليوم والدخول للموقع
              </button>
            </div>
          </>
        )}

        {/* Close Button (only in story step) */}
        {currentStep === "story" && (
          <div className="text-center mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              إغلاق
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
