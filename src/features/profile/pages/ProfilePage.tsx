/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../core/providers/AuthProvider";
import {
  getProfile,
  updateProfile,
  getLearnedWords,
  getMyAchievements,
  getProgress,
  getStreak,
} from "../../../core/utils/api";
import { API_ENDPOINTS } from "../../../core/config/api";
import { Loading } from "@/presentation/components";

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isPersonalizationEditing, setIsPersonalizationEditing] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState({
    daysLearned: 0,
    wordsLearned: 0,
    storiesCompleted: 0,
    achievementPoints: 0,
    streak: 0,
    progress: 0,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    level: "",
    goal: "",
  });

  const [personalizationData, setPersonalizationData] = useState({
    favoriteHobby: "",
    favoriteColor: "",
    favoriteAnimal: "",
    favoriteFood: "",
    dreamJob: "",
    favoritePlace: "",
    learningGoal: "",
    personality: "",
  });

  const [learnedWords, setLearnedWords] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // جلب البروفايل
        const profileRes = await getProfile();
        if (profileRes.success && profileRes.data) {
          const userData = profileRes.data;
          const user = (userData.user || userData) as any;
          setFormData({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            birthDate: user.birthDate
              ? new Date(user.birthDate).toISOString().split("T")[0]
              : "",
            level: user.level || "",
            goal: user.goal || "",
          });

          // جلب بيانات التخصيص
          if (user.favoriteHobby) {
            setPersonalizationData({
              favoriteHobby: user.favoriteHobby || "",
              favoriteColor: user.favoriteColor || "",
              favoriteAnimal: user.favoriteAnimal || "",
              favoriteFood: user.favoriteFood || "",
              dreamJob: user.dreamJob || "",
              favoritePlace: user.favoritePlace || "",
              learningGoal: user.learningGoal || "",
              personality: user.personality || "",
            });
          }
        }

        // جلب الإنجازات
        const achievementsRes = await getMyAchievements();
        if (achievementsRes.success && achievementsRes.data) {
          setAchievements(achievementsRes.data.achievements || []);
        }

        // جلب الإحصائيات
        const [progressRes, streakRes, learnedRes] = await Promise.all([
          getProgress(),
          getStreak(),
          getLearnedWords(),
        ]);

        if (progressRes.success && progressRes.data) {
          const progressData = progressRes.data as any;
          setStats((prev) => ({
            ...prev,
            progress: progressData.progressPercent || 0,
            storiesCompleted: progressData.completedLessons || 0,
          }));
        }

        if (streakRes.success && streakRes.data) {
          const streakData = streakRes.data as any;
          setStats((prev) => ({
            ...prev,
            streak: streakData.currentStreak || 0,
            daysLearned: streakData.currentStreak || 0,
          }));
        }

        if (learnedRes.success && learnedRes.data) {
          const learnedData = learnedRes.data as any;
          const publicWords = Array.isArray(learnedData.public)
            ? learnedData.public
            : [];
          const privateWords = Array.isArray(learnedData.private)
            ? learnedData.private
            : [];
          const allWords = [...publicWords, ...privateWords];
          setLearnedWords(allWords);
          setStats((prev) => ({
            ...prev,
            wordsLearned: allWords.length,
          }));
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleSave = async () => {
    try {
      const response = await updateProfile(formData);
      if (response.success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handlePersonalizationSave = async () => {
    try {
      const response = await updateProfile(personalizationData);
      if (response.success) {
        setIsPersonalizationEditing(false);
      }
    } catch (error) {
      console.error("Error updating personalization:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePersonalizationChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setPersonalizationData({
      ...personalizationData,
      [e.target.name]: e.target.value,
    });
  };

  const levelOptions = [
    { value: "L1", label: "مبتدئ - L1" },
    { value: "L2", label: "متوسط - L2" },
    { value: "L3", label: "متقدم - L3" },
    { value: "L4", label: "خبير - L4" },
    { value: "L5", label: "محترف - L5" },
    { value: "L6", label: "محترف عالي المستوى - L6" },
    { value: "L7", label: "محترف عالي المستوى - L7" },
    { value: "L8", label: "محترف عالي المستوى - L8" },
  ];

  const personalityOptions = [
    { value: "مصمم", label: "مصمم" },
    { value: "مبدع", label: "مبدع" },
    { value: "منطقي", label: "منطقي" },
    { value: "اجتماعي", label: "اجتماعي" },
    { value: "هادئ", label: "هادئ" },
  ];

  const tabs = [
    { id: "profile", label: "الملف الشخصي", icon: "👤" },
    { id: "personalization", label: "التخصيص", icon: "⚙️" },
    { id: "achievements", label: "الإنجازات", icon: "🏆" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading
          size="lg"
          variant="video"
          text="جاري تحميل البيانات..."
          isOverlay
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-700 transition-all duration-500">
      {/* Header with Avatar */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-white dark:bg-gray-700 opacity-90"></div>
        <div className="relative px-3 sm:px-6 py-6 sm:py-8 md:py-12">
          <div className="max-w-4xl mx-auto text-center">
            {/* Name & Level */}
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 px-2">
              {formData.name || "اسم المستخدم"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 px-2">
              {levelOptions.find((opt) => opt.value === formData.level)
                ?.label || "مستوى غير محدد"}
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 max-w-2xl mx-auto px-2">
              {[
                { label: "أيام التعلم", value: stats.daysLearned, icon: "🔥" },
                {
                  label: "كلمات متعلمة",
                  value: stats.wordsLearned,
                  icon: "📚",
                },
                {
                  label: "قصص مكتملة",
                  value: stats.storiesCompleted,
                  icon: "📖",
                },
                { label: "إنجازات", value: achievements.length, icon: "🏆" },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-slate-300 dark:bg-gray-800 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 border border-gray-200 dark:border-gray-700   "
                >
                  <div className="text-lg sm:text-xl md:text-2xl mb-1">
                    {stat.icon}
                  </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto no-scrollbar px-2 sm:px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <span className="text-base sm:text-lg">{tab.icon}</span>
              <span className="font-medium whitespace-nowrap text-sm sm:text-base">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Basic Information Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 backdrop-blur-sm border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                    <span className="text-2xl sm:text-3xl">ℹ️</span>
                    المعلومات الأساسية
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
                    معلوماتك الشخصية الأساسية
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {[
                  {
                    key: "name",
                    label: "الاسم الكامل",
                    type: "text",
                    icon: "👤",
                  },
                  {
                    key: "email",
                    label: "البريد الإلكتروني",
                    type: "email",
                    icon: "📧",
                  },
                  {
                    key: "phone",
                    label: "رقم الهاتف",
                    type: "tel",
                    icon: "📱",
                  },
                  {
                    key: "birthDate",
                    label: "تاريخ الميلاد",
                    type: "date",
                    icon: "📅",
                  },
                ].map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span className="text-base sm:text-lg">{field.icon}</span>
                      {field.label}
                    </label>

                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-700 rounded-lg sm:rounded-xl border-2 border-transparent">
                      <span className="text-gray-900 dark:text-white font-medium text-sm sm:text-base">
                        {field.key === "birthDate" && formData.birthDate
                          ? new Date(formData.birthDate).toLocaleDateString(
                              "en-US"
                            )
                          : formData[field.key as keyof typeof formData] ||
                            "غير محدد"}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="space-y-2">
                  <label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span className="text-base sm:text-lg">📊</span>
                    المستوى الحالي
                  </label>

                  <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-700 rounded-lg sm:rounded-xl border-2 border-transparent">
                    <span className="text-gray-900 dark:text-white font-medium text-sm sm:text-base">
                      {levelOptions.find((opt) => opt.value === formData.level)
                        ?.label || "غير محدد"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Learned Words */}
            {user?.role === "USER" && learnedWords.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 backdrop-blur-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                  <span className="text-2xl sm:text-3xl">📚</span>
                  الكلمات المتعلمة ({learnedWords.length})
                </h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {learnedWords.slice(0, 30).map((word, idx) => (
                    <span
                      key={idx}
                      className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900 dark:to-emerald-900 dark:text-green-200 px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm border border-green-200 dark:border-green-700 hover:shadow-md transition-all duration-200"
                    >
                      {word.word || word.english}
                    </span>
                  ))}
                  {learnedWords.length > 30 && (
                    <span className="text-xs sm:text-sm text-gray-500 px-3 sm:px-4 py-1 sm:py-2">
                      +{learnedWords.length - 30} كلمة أخرى...
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Personalization Tab */}
        {activeTab === "personalization" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 backdrop-blur-sm border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                  <span className="text-2xl sm:text-3xl">⚙️</span>
                  معلومات التخصيص
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
                  لتخصيص القصص حسب اهتماماتك
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {[
                {
                  key: "favoriteHobby",
                  label: "الهواية المفضلة",
                  icon: "🎨",
                  placeholder: "مثال: قراءة الكتب",
                },
                {
                  key: "favoriteColor",
                  label: "اللون المفضل",
                  icon: "🌈",
                  placeholder: "مثال: أزرق",
                },
                {
                  key: "favoriteAnimal",
                  label: "الحيوان المفضل",
                  icon: "🐱",
                  placeholder: "مثال: قط",
                },
                {
                  key: "favoriteFood",
                  label: "الطعام المفضل",
                  icon: "🍕",
                  placeholder: "مثال: بيتزا",
                },
                {
                  key: "dreamJob",
                  label: "الوظيفة المفضلة",
                  icon: "💼",
                  placeholder: "مثال: معلم",
                },
                {
                  key: "favoritePlace",
                  label: "المكان المفضل",
                  icon: "🏛️",
                  placeholder: "مثال: مكتبة",
                },
                {
                  key: "learningGoal",
                  label: "هدف التعلم",
                  icon: "🎯",
                  placeholder: "مثال: تحسين التحدث بالإنجليزية",
                },
              ].map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span className="text-base sm:text-lg">{field.icon}</span>
                    {field.label}
                  </label>
                  {isPersonalizationEditing ? (
                    <input
                      type="text"
                      name={field.key}
                      value={
                        personalizationData[
                          field.key as keyof typeof personalizationData
                        ]
                      }
                      onChange={handlePersonalizationChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 text-sm sm:text-base"
                      dir="rtl"
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-700 rounded-lg sm:rounded-xl border-2 border-transparent">
                      <span className="text-gray-900 dark:text-white font-medium text-sm sm:text-base">
                        {personalizationData[
                          field.key as keyof typeof personalizationData
                        ] || "غير محدد"}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              <div className="space-y-2">
                <label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span className="text-base sm:text-lg">🧠</span>
                  نوع الشخصية
                </label>
                {isPersonalizationEditing ? (
                  <select
                    name="personality"
                    value={personalizationData.personality}
                    onChange={handlePersonalizationChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                  >
                    <option value="">اختر نوع الشخصية</option>
                    {personalityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-700 rounded-lg sm:rounded-xl border-2 border-transparent">
                    <span className="text-gray-900 dark:text-white font-medium text-sm sm:text-base">
                      {personalizationData.personality || "غير محدد"}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2 flex justify-center">
                <button
                  onClick={() =>
                    setIsPersonalizationEditing(!isPersonalizationEditing)
                  }
                  className={`px-4 sm:px-6 py-2 sm:py-3 w-full text-xl dark:bg-white/100 dark:hover:bg-white/600 bg-gray-700 hover:bg-gray-800 dark:text-black   rounded-lg sm:rounded-xl font-medium transition-all duration-200 transform hover:scale-105  sm:text-base ${
                    isPersonalizationEditing
                      ? "bg-red-500 hover:bg-red-600 text-white shadow-lg"
                      : "dark:bg-white/100 dark:hover:bg-white/600 bg-gray-700 hover:bg-gray-800 dark:text-black   text-white shadow-lg"
                  }`}
                >
                  {isPersonalizationEditing ? "إلغاء " : "تعديل "}
                </button>
              </div>
            </div>

            {isPersonalizationEditing && (
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handlePersonalizationSave}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-2 sm:py-3 px-6 sm:px-8 rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                >
                  حفظ التخصيص ✅
                </button>
                <button
                  onClick={() => setIsPersonalizationEditing(false)}
                  className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 sm:py-3 px-6 sm:px-8 rounded-lg sm:rounded-xl transition-all duration-200 text-sm sm:text-base"
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 backdrop-blur-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">🏆</span>
              الإنجازات ({achievements.length})
            </h2>

            {achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="group relative bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-yellow-200 dark:border-yellow-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="text-3xl sm:text-4xl bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-2 sm:p-3 shadow-lg">
                        {achievement.achievement?.icon || "🏆"}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-2">
                          {achievement.achievement?.name ||
                            achievement.achievement?.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {achievement.achievement?.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                            {new Date(
                              achievement.achievedAt
                            ).toLocaleDateString("ar-SA")}
                          </span>
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs sm:text-sm font-bold">
                              ✓
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sparkle Animation */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="text-yellow-400 animate-pulse">✨</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16">
                <div className="text-6xl sm:text-8xl mb-4 sm:mb-6 animate-bounce">
                  🏆
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  لم تحصل على إنجازات بعد
                </h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-500">
                  استمر في التعلم واكتشف إنجازات جديدة!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 sm:w-32 sm:h-32 bg-purple-200 dark:bg-purple-800 rounded-full opacity-20 animate-pulse"></div>
        <div
          className="absolute top-40 right-20 w-16 h-16 sm:w-24 sm:h-24 bg-blue-200 dark:bg-blue-800 rounded-full opacity-30 animate-ping"
          style={{ animationDuration: "3s" }}
        ></div>
        <div
          className="absolute bottom-40 left-20 w-24 h-24 sm:w-40 sm:h-40 bg-pink-200 dark:bg-pink-800 rounded-full opacity-20 animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-20 h-20 sm:w-28 sm:h-28 bg-indigo-200 dark:bg-indigo-800 rounded-full opacity-25 animate-ping"
          style={{ animationDuration: "5s" }}
        ></div>
      </div>

      <style>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
