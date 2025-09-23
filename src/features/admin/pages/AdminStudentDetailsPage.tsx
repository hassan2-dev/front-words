import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  apiClient,
  getAllDailyStories,
  getUserAchievements,
  getAllWords,
  getDailyStoryWordStatistics,
  getAllDailyStoryWords,
  getLearnedWordsFromStory,
} from "../../../core/utils/api";
import { API_ENDPOINTS } from "../../../core/config/api";
import { Loading } from "../../../presentation/components";
import toast from "react-hot-toast";
import { User, DailyStory, Word, Achievement } from "../../../core/types";

/**
 * صفحة تفاصيل الطالب للمدير - محسنة ومرتبة
 *
 * التحسينات المضافة:
 * - تصميم أكثر تنظيماً وجاذبية
 * - ألوان متناسقة ومتدرجة
 * - تحسينات في التخطيط والمسافات
 * - إضافة رسوم بيانية بصرية
 * - تحسين التفاعل والاستجابة
 */

interface StudentStats {
  totalStories: number;
  completedStories: number;
  totalWords: number;
  knownWords: number;
  partiallyKnownWords: number;
  unknownWords: number;
  currentStreak: number;
  totalPoints: number;
  level: number;
  experience: number;
  nextLevelExp: number;
}

interface StudentDetails {
  user: User;
  stats: StudentStats;
  recentStories: DailyStory[];
  achievements: Achievement[];
  allWords: Word[];
}

// دالة حساب المستوى والخبرة
const calculateLevelAndExp = (totalPoints: number) => {
  const maxLevel = 8;
  const expPerLevel = 100; // 100 نقطة لكل مستوى

  const currentLevel = Math.min(
    Math.floor(totalPoints / expPerLevel) + 1,
    maxLevel
  );
  const currentExp = totalPoints % expPerLevel;
  const nextLevelExp = expPerLevel;

  return {
    level: currentLevel,
    experience: currentExp,
    nextLevelExp: nextLevelExp,
    progressPercentage: (currentExp / nextLevelExp) * 100,
  };
};

const AdminStudentDetailsPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(
    null
  );
  const [upgrading, setUpgrading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [newLevel, setNewLevel] = useState<number>(1);

  useEffect(() => {
    if (studentId) {
      fetchStudentDetails();
    }
  }, [studentId]);

  const fetchStudentDetails = async () => {
    if (!studentId) return;

    try {
      setLoading(true);

      const userResponse = await apiClient.get(
        API_ENDPOINTS.ADMIN.USERS.GET(studentId)
      );

      const [
        studentStatsResponse,
        storiesResponse,
        achievementsResponse,
        allWordsResponse,
      ] = await Promise.allSettled([
        apiClient.get(`/admin/student-stats/${studentId}`), // إحصائيات الطالب الجديدة
        getAllDailyStories(studentId),
        getUserAchievements(studentId),
        apiClient.get(API_ENDPOINTS.WORDS.ALL), // جميع الكلمات في النظام
      ]);

      const studentStats =
        studentStatsResponse.status === "fulfilled"
          ? (studentStatsResponse.value.data as any)?.data ||
            (studentStatsResponse.value.data as any)
          : null;
      const stories =
        storiesResponse.status === "fulfilled"
          ? (storiesResponse.value.data as any)?.data ||
            (storiesResponse.value.data as any)
          : [];
      const achievements =
        achievementsResponse.status === "fulfilled"
          ? (achievementsResponse.value.data as any)?.data ||
            (achievementsResponse.value.data as any)
          : [];
      const allWords =
        allWordsResponse.status === "fulfilled"
          ? (allWordsResponse.value.data as any)?.data ||
            (allWordsResponse.value.data as any)
          : [];
      // تبسيط معالجة البيانات - مثل TrainerStudentDetailsPage
      console.log("=== SIMPLIFIED DATA PROCESSING ===");
      console.log(
        "Student Stats Response Status:",
        studentStatsResponse.status
      );
      console.log(
        "Student Stats Response Data:",
        studentStatsResponse.status === "fulfilled"
          ? studentStatsResponse.value
          : null
      );
      console.log("Student Stats Extracted:", studentStats);
      console.log("All Words Response Status:", allWordsResponse.status);
      console.log(
        "All Words Response Data:",
        allWordsResponse.status === "fulfilled" ? allWordsResponse.value : null
      );
      console.log("All Words Extracted:", allWords);

      // تسجيل مفصل لهيكل البيانات المستلمة
      console.log("=== DETAILED API RESPONSE ANALYSIS ===");
      console.log("Student Stats Response:", {
        status: studentStatsResponse.status,
        data:
          studentStatsResponse.status === "fulfilled"
            ? studentStatsResponse.value.data
            : null,
        extracted: studentStats,
      });

      console.log("Stories Response:", {
        status: storiesResponse.status,
        data:
          storiesResponse.status === "fulfilled"
            ? storiesResponse.value.data
            : null,
        extracted: stories,
        isArray: Array.isArray(stories),
        length: Array.isArray(stories) ? stories.length : "Not an array",
      });

      console.log("Achievements Response:", {
        status: achievementsResponse.status,
        data:
          achievementsResponse.status === "fulfilled"
            ? achievementsResponse.value.data
            : null,
        extracted: achievements,
        isArray: Array.isArray(achievements),
        length: Array.isArray(achievements)
          ? achievements.length
          : "Not an array",
      });

      console.log("All Words Response:", {
        status: allWordsResponse.status,
        data:
          allWordsResponse.status === "fulfilled"
            ? allWordsResponse.value.data
            : null,
        extracted: allWords,
        isArray: Array.isArray(allWords),
        length: Array.isArray(allWords) ? allWords.length : "Not an array",
        rawData:
          allWordsResponse.status === "fulfilled"
            ? allWordsResponse.value.data
            : null,
        fullResponse:
          allWordsResponse.status === "fulfilled"
            ? allWordsResponse.value
            : null,
      });

      // تم تبسيط تسجيل البيانات

      if (studentStatsResponse.status === "rejected") {
        console.warn(
          "Failed to fetch student stats:",
          studentStatsResponse.reason
        );
      }
      if (storiesResponse.status === "rejected") {
        console.warn("Failed to fetch stories:", storiesResponse.reason);
      }
      if (achievementsResponse.status === "rejected") {
        console.warn(
          "Failed to fetch achievements:",
          achievementsResponse.reason
        );
      }
      if (allWordsResponse.status === "rejected") {
        console.warn("Failed to fetch all words:", allWordsResponse.reason);
      }

      const userData =
        (userResponse.data as any)?.data?.user ||
        (userResponse.data as any)?.data ||
        (userResponse.data as any)?.user;

      if (!userData) {
        console.error("User data not found in response:", userResponse.data);
        throw new Error("فشل في جلب بيانات المستخدم");
      }

      // معالجة أفضل للبيانات مع محاولة استخراج البيانات الحقيقية
      let processedStories = [];
      let processedAchievements = [];

      // معالجة القصص
      if (Array.isArray(stories)) {
        processedStories = stories;
      } else if (stories && typeof stories === "object") {
        // محاولة استخراج القصص من هيكل مختلف
        if (stories.stories && Array.isArray(stories.stories)) {
          processedStories = stories.stories;
        } else if (stories.data && Array.isArray(stories.data)) {
          processedStories = stories.data;
        } else if (stories.results && Array.isArray(stories.results)) {
          processedStories = stories.results;
        } else if (stories.id && stories.title) {
          // إذا كانت القصة واحدة وليست مصفوفة
          processedStories = [stories];
        }
      }

      // معالجة الكلمات المبسطة - مثل TrainerStudentDetailsPage
      let processedWords: any[] = [];
      let totalWords = 0;
      let knownWords = 0;
      let partiallyKnownWords = 0;
      let unknownWords = 0;

      // استخدام البيانات من الـ student stats الجديدة
      if (studentStats && studentStats.words) {
        totalWords = studentStats.words.totalWords || 0;
        knownWords = studentStats.words.knownWords || 0;
        partiallyKnownWords = studentStats.words.partiallyKnownWords || 0;
        unknownWords = studentStats.words.unknownWords || 0;

        console.log("✅ Using student stats data:");
        console.log("Total Words:", totalWords);
        console.log("Known Words:", knownWords);
        console.log("Partially Known Words:", partiallyKnownWords);
        console.log("Unknown Words:", unknownWords);
      } else {
        console.log("❌ No student stats data available, using fallback");

        // معالجة جميع الكلمات - مع تسجيل مفصل
        console.log("🔍 DEBUGGING ALL WORDS:");
        console.log("allWords type:", typeof allWords);
        console.log("allWords is array:", Array.isArray(allWords));
        console.log(
          "allWords keys:",
          allWords ? Object.keys(allWords) : "null/undefined"
        );
        console.log("allWords full structure:", allWords);

        if (allWords && typeof allWords === "object") {
          if (allWords.public && Array.isArray(allWords.public)) {
            totalWords = allWords.public.length;
            processedWords = [...allWords.public];
            console.log("✅ All words from .public:", totalWords);

            // إضافة الكلمات الخاصة إذا كانت موجودة
            if (
              allWords.private &&
              Array.isArray(allWords.private) &&
              allWords.private.length > 0
            ) {
              totalWords += allWords.private.length;
              processedWords = [...processedWords, ...allWords.private];
              console.log("✅ Added private words:", allWords.private.length);
            }
          } else if (Array.isArray(allWords)) {
            // إذا كانت البيانات مصفوفة مباشرة
            totalWords = allWords.length;
            processedWords = [...allWords];
            console.log("✅ All words from array:", totalWords);
          } else {
            console.log("❌ Could not extract words from:", allWords);
            console.log("Available keys:", Object.keys(allWords));
          }
        } else {
          console.log("❌ allWords is not an object:", allWords);
        }

        // حساب الكلمات غير المعروفة
        unknownWords = Math.max(
          0,
          totalWords - knownWords - partiallyKnownWords
        );
      }

      console.log("=== SIMPLIFIED WORD PROCESSING ===");
      console.log("All Words Structure:", allWords);
      console.log("=== FINAL WORD STATS ===");
      console.log("Total Words:", totalWords);
      console.log("Known Words:", knownWords);
      console.log("Partially Known Words:", partiallyKnownWords);
      console.log("Unknown Words:", unknownWords);
      console.log("Processed Words Length:", processedWords.length);

      // معالجة الإنجازات
      if (Array.isArray(achievements)) {
        processedAchievements = achievements;
      } else if (achievements && typeof achievements === "object") {
        // محاولة استخراج الإنجازات من هيكل مختلف
        if (
          achievements.achievements &&
          Array.isArray(achievements.achievements)
        ) {
          processedAchievements = achievements.achievements;
        } else if (achievements.data && Array.isArray(achievements.data)) {
          processedAchievements = achievements.data;
        } else if (
          achievements.results &&
          Array.isArray(achievements.results)
        ) {
          processedAchievements = achievements.results;
        }
      }

      console.log("=== SIMPLIFIED PROCESSED DATA ===");
      console.log("Processed Stories:", processedStories.length);
      console.log("Processed Words:", processedWords.length);
      console.log("Processed Achievements:", processedAchievements.length);

      // حساب المستوى والخبرة
      const levelData = calculateLevelAndExp(studentStats?.totalPoints || 0);

      setStudentDetails({
        user: userData,
        stats: {
          // استخدام البيانات من الـ student stats الجديدة
          totalStories: studentStats?.stories?.totalStories || 0,
          completedStories: studentStats?.stories?.completedStories || 0,
          totalWords: totalWords || studentStats?.words?.totalWords || 0,
          knownWords: knownWords || studentStats?.words?.knownWords || 0,
          partiallyKnownWords:
            partiallyKnownWords ||
            studentStats?.words?.partiallyKnownWords ||
            0,
          unknownWords: unknownWords || studentStats?.words?.unknownWords || 0,
          currentStreak: 0, // سيتم إضافته لاحقاً
          totalPoints: 0, // سيتم إضافته لاحقاً
          level: levelData.level,
          experience: levelData.experience,
          nextLevelExp: levelData.nextLevelExp,
        },
        recentStories: processedStories,
        achievements: processedAchievements,
        allWords: processedWords, // قائمة الكلمات المحسوبة
      });
    } catch (error: any) {
      console.error("Error fetching student details:", error);

      if (error.message === "فشل في جلب بيانات المستخدم") {
        toast.error("فشل في جلب بيانات المستخدم. تأكد من صحة معرف الطالب.");
      } else {
        toast.error(
          "فشل في جلب تفاصيل الطالب. تحقق من اتصال الإنترنت وحاول مرة أخرى."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeStudent = async () => {
    if (!studentId) return;

    try {
      setUpgrading(true);

      await apiClient.put(API_ENDPOINTS.ADMIN.USERS.UPDATE(studentId), {
        level: `L${newLevel}`,
      });

      toast.success("تم ترقية الطالب بنجاح");
      setShowUpgradeModal(false);
      fetchStudentDetails();
    } catch (error: any) {
      console.error("Error upgrading student:", error);
      toast.error("فشل في ترقية الطالب");
    } finally {
      setUpgrading(false);
    }
  };

  const getLevelName = (level: number): string => {
    const levels = {
      1: "مبتدئ",
      2: "متوسط",
      3: "متقدم",
      4: "خبير",
      5: "أستاذ",
    };
    return levels[level as keyof typeof levels] || "غير محدد";
  };

  const getLevelColor = (level: number): string => {
    const colors = {
      1: "from-gray-400 to-gray-600",
      2: "from-green-400 to-green-600",
      3: "from-blue-400 to-blue-600",
      4: "from-purple-400 to-purple-600",
      5: "from-yellow-400 to-yellow-600",
    };
    return colors[level as keyof typeof colors] || "from-gray-400 to-gray-600";
  };

  const getProgressPercentage = (current: number, total: number): number => {
    return total > 0 ? (current / total) * 100 : 0;
  };

  if (loading) {
    return (
      <Loading
        isOverlay
        variant="video"
        text="جاري تحميل تفاصيل الطالب..."
        size="xl"
      />
    );
  }

  if (!studentDetails || !studentDetails.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            لم يتم العثور على الطالب
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            تعذر العثور على بيانات هذا الطالب أو قد يكون المعرف غير صحيح
          </p>
          <button
            onClick={() => navigate("/admin/users")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            العودة إلى قائمة المستخدمين
          </button>
        </div>
      </div>
    );
  }

  const { user, stats, recentStories, achievements } = studentDetails;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header مع تصميم محسن */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <button
                onClick={() => navigate("/admin/users")}
                className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
              >
                <svg
                  className="w-6 h-6"
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
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  تفاصيل الطالب
                </h1>
                <div className="flex items-center space-x-3 rtl:space-x-reverse mt-2">
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {user?.name || "غير محدد"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg
                className="w-5 h-5 inline-block ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              ترقية الطالب
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* بطاقة معلومات الطالب الأساسية - محسنة */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 lg:p-8 sticky top-32">
              <div className="text-center mb-8">
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 mx-auto mb-4 sm:mb-6 bg-gradient-to-br ${getLevelColor(
                    user?.level || 1
                  )} rounded-full flex items-center justify-center shadow-xl ring-4 ring-white/20`}
                >
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {user?.name || "غير محدد"}
                </h2>
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getLevelColor(
                    user?.level || 1
                  )} shadow-lg`}
                >
                  المستوى {user?.level || 1} - {getLevelName(user?.level || 1)}
                </div>

                {/* شريط تقدم المستوى */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      التقدم
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {stats?.totalPoints || 0} / {(stats?.level || 1) * 100}{" "}
                      نقطة
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getLevelColor(
                        user?.level || 1
                      )} transition-all duration-1000 ease-out`}
                      style={{
                        width: `${Math.min(
                          (((stats?.totalPoints || 0) % 100) / 100) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {100 - ((stats?.totalPoints || 0) % 100)} نقطة للوصول
                    للمستوى التالي
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* معلومات التواصل */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
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
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        رقم الهاتف
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user?.phone || "غير محدد"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 rtl:space-x-reverse p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
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
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        البريد الإلكتروني
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {user?.email || "غير محدد"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 rtl:space-x-reverse p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
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
                          d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h-2V5H10v2H8zm-3 1h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        تاريخ الانضمام
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("ar-SA")
                          : "غير محدد"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* النقاط الإجمالية - مميزة */}
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-center text-white shadow-lg">
                  <div className="flex items-center justify-center mb-3">
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
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium mb-2">النقاط الإجمالية</h3>
                  <p className="text-3xl font-bold">
                    {stats?.totalPoints || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* المحتوى الرئيسي */}
          <div className="lg:col-span-3 space-y-6 lg:space-y-8">
            {/* بطاقات الإحصائيات المحسنة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* إحصائيات القصص */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white"
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
                  <div className="text-right">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      القصص
                    </h3>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stats?.completedStories || 0}/{stats?.totalStories || 0}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${getProgressPercentage(
                        stats?.completedStories || 0,
                        stats?.totalStories || 1
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getProgressPercentage(
                    stats?.completedStories || 0,
                    stats?.totalStories || 1
                  ).toFixed(0)}
                  % مكتملة
                </p>
              </div>

              {/* إحصائيات الكلمات */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      الكلمات
                    </h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats?.knownWords || 0}/{stats?.totalWords || 0}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 dark:text-green-400">
                      معروفة
                    </span>
                    <span className="font-medium">
                      {stats?.knownWords || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-600 dark:text-yellow-400">
                      جزئياً
                    </span>
                    <span className="font-medium">
                      {stats?.partiallyKnownWords || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600 dark:text-red-400">
                      غير معروفة
                    </span>
                    <span className="font-medium">
                      {stats?.unknownWords || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* الإنجاز المتتالي */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    الإنجاز المتتالي
                  </h3>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                    {stats?.currentStreak || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    أيام متتالية
                  </p>
                </div>
              </div>

              {/* مستوى التقدم */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-center">
                  <div
                    className={`w-14 h-14 mx-auto mb-4 bg-gradient-to-br ${getLevelColor(
                      user?.level || 1
                    )} rounded-xl flex items-center justify-center shadow-lg`}
                  >
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    المستوى الحالي
                  </h3>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {user?.level || 1}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getLevelName(user?.level || 1)}
                  </p>
                </div>
              </div>
            </div>

            {/* القصص الأخيرة - محسنة */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
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
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    القصص الأخيرة
                  </h3>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  {recentStories.length} قصة
                </span>
              </div>

              <div className="space-y-4">
                {recentStories.length > 0 ? (
                  recentStories.slice(0, 5).map((story, index) => (
                    <div
                      key={story.id}
                      className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/30 dark:to-gray-800/30 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300 hover:border-indigo-200 dark:hover:border-indigo-700"
                    >
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-xl flex items-center justify-center group-hover:shadow-md transition-all duration-200">
                          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {story.title}
                          </h4>
                          <div className="flex items-center space-x-4 rtl:space-x-reverse mt-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(story.date).toLocaleDateString("ar-SA")}
                            </p>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {story.words?.length || 0} كلمة
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            story.isCompleted
                              ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 shadow-green-200/50"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 shadow-yellow-200/50"
                          } shadow-lg`}
                        >
                          {story.isCompleted ? "مكتملة ✓" : "قيد التنفيذ ⏳"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-400"
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
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      لا توجد قصص بعد
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      لم يقم الطالب بإكمال أي قصة حتى الآن
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* إحصائيات الكلمات - محسنة */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 sm:p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    إحصائيات الكلمات
                  </h3>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  {stats?.totalWords || 0} كلمة إجمالي
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* الكلمات المعروفة */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-4 border border-green-200/50 dark:border-green-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
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
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats?.knownWords || 0}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    معروفة
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {getProgressPercentage(
                      stats?.knownWords || 0,
                      stats?.totalWords || 1
                    ).toFixed(1)}
                    %
                  </p>
                </div>

                {/* الكلمات المعروفة جزئياً */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-xl p-4 border border-yellow-200/50 dark:border-yellow-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
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
                    <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {stats?.partiallyKnownWords || 0}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    معروفة جزئياً
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {getProgressPercentage(
                      stats?.partiallyKnownWords || 0,
                      stats?.totalWords || 1
                    ).toFixed(1)}
                    %
                  </p>
                </div>

                {/* الكلمات غير المعروفة */}
                <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 rounded-xl p-4 border border-red-200/50 dark:border-red-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-pink-500 rounded-lg flex items-center justify-center">
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {stats?.unknownWords || 0}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    غير معروفة
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {getProgressPercentage(
                      stats?.unknownWords || 0,
                      stats?.totalWords || 1
                    ).toFixed(1)}
                    %
                  </p>
                </div>

                {/* إجمالي الكلمات */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stats?.totalWords || 0}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    إجمالي الكلمات
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    جميع الكلمات المتاحة
                  </p>
                </div>
              </div>
            </div>

            {/* الإنجازات المحققة - محسنة */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    الإنجازات المحققة
                  </h3>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  {achievements.length} إنجاز
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.length > 0 ? (
                  achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="group flex items-center space-x-4 rtl:space-x-reverse p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-xl border border-yellow-200/50 dark:border-yellow-700/50 hover:shadow-lg transition-all duration-300 hover:border-yellow-300 dark:hover:border-yellow-600"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {achievement.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {achievement.description}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold px-3 py-1 rounded-full text-sm shadow-lg">
                          +{achievement.points}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          نقطة
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 713.138-3.138z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      لا توجد إنجازات محققة بعد
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      لم يحقق الطالب أي إنجازات حتى الآن
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal ترقية الطالب - محسن */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
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
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  ترقية الطالب
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  قم بتحديد المستوى الجديد للطالب {user?.name}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    المستوى الحالي:
                  </span>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getLevelColor(
                      user?.level || 1
                    )}`}
                  >
                    المستوى {user?.level || 1} -{" "}
                    {getLevelName(user?.level || 1)}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  المستوى الجديد
                </label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 font-medium"
                >
                  {[1, 2, 3, 4, 5].map((level) => (
                    <option
                      key={level}
                      value={level}
                      disabled={level <= (user?.level || 1)}
                    >
                      المستوى {level} - {getLevelName(level)}
                      {level <= (user?.level || 1)
                        ? " (المستوى الحالي أو أقل)"
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-4 rtl:space-x-reverse">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleUpgradeStudent}
                  disabled={upgrading || newLevel <= (user?.level || 1)}
                  className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    upgrading || newLevel <= (user?.level || 1)
                      ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  }`}
                >
                  {upgrading ? (
                    <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>جاري الترقية...</span>
                    </div>
                  ) : (
                    "ترقية الطالب"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentDetailsPage;
