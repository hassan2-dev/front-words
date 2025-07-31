import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaCheck,
  FaTimes,
  FaGraduationCap,
  FaTrophy,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import type { DailyStory } from "@/core/types";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

interface StoryExamProps {
  story?: DailyStory;
  onComplete?: (score: number, totalQuestions: number) => void;
  onClose?: () => void;
}

export const StoryExamPage: React.FC<StoryExamProps> = ({
  story: propStory,
  onComplete,
  onClose,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStory, setCurrentStory] = useState<DailyStory | null>(
    propStory || null
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  // Get story from location state if not provided as prop
  useEffect(() => {
    if (!currentStory && location.state?.story) {
      setCurrentStory(location.state.story);
    }
  }, [location.state, currentStory]);

  // Generate questions from story
  useEffect(() => {
    if (currentStory) {
      generateQuestions();
    }
  }, [currentStory]);

  const generateQuestions = () => {
    if (!currentStory) return;

    const generatedQuestions: Question[] = [
      {
        id: "1",
        question: "ما هو الموضوع الرئيسي للقصة؟",
        options: [
          "مغامرة في الغابة",
          "صداقة بين الحيوانات",
          "رحلة تعليمية",
          "مغامرة فضائية",
        ],
        correctAnswer: "رحلة تعليمية",
        explanation: "القصة تركز على التعلم واكتساب المعرفة",
      },
      {
        id: "2",
        question: "كم عدد الكلمات الجديدة في القصة؟",
        options: [
          `${
            currentStory.words.filter((w) => w.status === "NOT_LEARNED").length
          }`,
          `${currentStory.words.length}`,
          `${currentStory.words.filter((w) => w.status === "KNOWN").length}`,
          "لا أعرف",
        ],
        correctAnswer: `${
          currentStory.words.filter((w) => w.status === "NOT_LEARNED").length
        }`,
        explanation: `القصة تحتوي على ${
          currentStory.words.filter((w) => w.status === "NOT_LEARNED").length
        } كلمة جديدة للتعلم`,
      },
      {
        id: "3",
        question: "ما هي الكلمة التي تعني 'التعلم' في القصة؟",
        options: currentStory.words.slice(0, 4).map((w) => w.word),
        correctAnswer: currentStory.words[0]?.word || "learn",
        explanation: `الكلمة الصحيحة هي '${currentStory.words[0]?.word}' وتعني '${currentStory.words[0]?.meaning}'`,
      },
      {
        id: "4",
        question: "أي من هذه الكلمات تعتبر كلمة معروفة؟",
        options: currentStory.words
          .filter((w) => w.status === "KNOWN")
          .slice(0, 4)
          .map((w) => w.word),
        correctAnswer:
          currentStory.words.find((w) => w.status === "KNOWN")?.word || "the",
        explanation: "الكلمات المعروفة هي التي تم تحديدها مسبقاً",
      },
      {
        id: "5",
        question: "ما هو مستوى الصعوبة المناسب لهذه القصة؟",
        options: ["مبتدئ", "متوسط", "متقدم", "خبير"],
        correctAnswer: "متوسط",
        explanation: "القصة مناسبة للمستوى المتوسط بناءً على الكلمات المستخدمة",
      },
    ];

    setQuestions(generatedQuestions);
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    setLoading(true);

    // Calculate score
    let correctAnswers = 0;
    questions.forEach((question) => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const finalScore = Math.round((correctAnswers / questions.length) * 100);
    setScore(finalScore);
    setShowResults(true);
    setLoading(false);

    if (onComplete) {
      onComplete(finalScore, questions.length);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setScore(0);
  };

  const handleFinish = () => {
    if (onClose) {
      onClose();
    } else {
      navigate("/dashboard");
    }
  };

  const getProgressPercentage = () => {
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  };

  const getQuestionStatus = (index: number) => {
    const questionId = questions[index]?.id;
    if (!questionId) return "unanswered";
    return selectedAnswers[questionId] ? "answered" : "unanswered";
  };

  if (!currentStory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            لا توجد قصة متاحة للامتحان
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            يرجى العودة إلى الداشبورد لاختيار قصة
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            العودة للداشبورد
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <FaTrophy color="#fff" size={40} />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            تم إكمال الامتحان! 🎉
          </h2>

          <div className="mb-6">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {score}%
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              النتيجة:{" "}
              {score >= 80 ? "ممتاز" : score >= 60 ? "جيد" : "يحتاج تحسين"}
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleRetake}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              إعادة الامتحان
            </button>

            <button
              onClick={handleFinish}
              className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300"
            >
              العودة للداشبورد
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  navigate("/story-reader", { state: { story: currentStory } })
                }
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <FaArrowLeft />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  امتحان القصة
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentStory.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                السؤال {currentQuestionIndex + 1} من {questions.length}
              </div>
              <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-300 ${
                  index === currentQuestionIndex
                    ? "bg-blue-500 text-white"
                    : getQuestionStatus(index) === "answered"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <FaGraduationCap color="#fff" size={32} />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {currentQuestion?.question}
              </h2>
            </div>

            <div className="space-y-4">
              {currentQuestion?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                    selectedAnswers[currentQuestion.id] === option
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswers[currentQuestion.id] === option
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {selectedAnswers[currentQuestion.id] === option && (
                        <FaCheck size={12} className="text-white" />
                      )}
                    </div>
                    <span className="font-medium">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mt-8">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FaArrowLeft />
                السابق
              </button>

              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    Object.keys(selectedAnswers).length < questions.length
                  }
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جاري التصحيح...
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      إنهاء الامتحان
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!selectedAnswers[currentQuestion.id]}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
                >
                  التالي
                  <FaArrowRight />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
