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
        // يمكن إضافة رسالة نجاح هنا
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
        // يمكن إضافة رسالة نجاح هنا
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
  ];

  const personalityOptions = [
    { value: "مصمم", label: "مصمم" },
    { value: "مبدع", label: "مبدع" },
    { value: "منطقي", label: "منطقي" },
    { value: "اجتماعي", label: "اجتماعي" },
    { value: "هادئ", label: "هادئ" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            جاري تحميل البيانات...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            الملف الشخصي
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            إدارة معلوماتك الشخصية وتتبع تقدمك
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  المعلومات الأساسية
                </h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isEditing ? "إلغاء" : "تعديل"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الاسم الكامل
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      dir="rtl"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formData.name || "غير محدد"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    البريد الإلكتروني
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      dir="rtl"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formData.email || "غير محدد"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رقم الهاتف
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      dir="rtl"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formData.phone || "غير محدد"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تاريخ الميلاد
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formData.birthDate
                        ? new Date(formData.birthDate).toLocaleDateString(
                            "ar-SA"
                          )
                        : "غير محدد"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    المستوى الحالي
                  </label>
                  {isEditing ? (
                    <select
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">اختر المستوى</option>
                      {levelOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {levelOptions.find((opt) => opt.value === formData.level)
                        ?.label || "غير محدد"}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الهدف من التعلم
                  </label>
                  {isEditing ? (
                    <textarea
                      name="goal"
                      value={formData.goal}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      dir="rtl"
                      placeholder="اكتب هدفك من تعلم اللغة الإنجليزية..."
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formData.goal || "غير محدد"}
                    </p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    حفظ التغييرات
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>

            {/* Personalization Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  معلومات التخصيص
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  لتخصيص القصص حسب اهتماماتك
                </p>
                <button
                  onClick={() =>
                    setIsPersonalizationEditing(!isPersonalizationEditing)
                  }
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isPersonalizationEditing ? "إلغاء" : "تعديل"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الهواية المفضلة
                  </label>
                  {isPersonalizationEditing ? (
                    <input
                      type="text"
                      name="favoriteHobby"
                      value={personalizationData.favoriteHobby}
                      onChange={handlePersonalizationChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      dir="rtl"
                      placeholder="مثال: قراءة الكتب"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {personalizationData.favoriteHobby || "غير محدد"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    اللون المفضل
                  </label>
                  {isPersonalizationEditing ? (
                    <input
                      type="text"
                      name="favoriteColor"
                      value={personalizationData.favoriteColor}
                      onChange={handlePersonalizationChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      dir="rtl"
                      placeholder="مثال: أزرق"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {personalizationData.favoriteColor || "غير محدد"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الحيوان المفضل
                  </label>
                  {isPersonalizationEditing ? (
                    <input
                      type="text"
                      name="favoriteAnimal"
                      value={personalizationData.favoriteAnimal}
                      onChange={handlePersonalizationChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      dir="rtl"
                      placeholder="مثال: قط"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {personalizationData.favoriteAnimal || "غير محدد"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الطعام المفضل
                  </label>
                  {isPersonalizationEditing ? (
                    <input
                      type="text"
                      name="favoriteFood"
                      value={personalizationData.favoriteFood}
                      onChange={handlePersonalizationChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      dir="rtl"
                      placeholder="مثال: بيتزا"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {personalizationData.favoriteFood || "غير محدد"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الوظيفة المفضلة
                  </label>
                  {isPersonalizationEditing ? (
                    <input
                      type="text"
                      name="dreamJob"
                      value={personalizationData.dreamJob}
                      onChange={handlePersonalizationChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      dir="rtl"
                      placeholder="مثال: معلم"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {personalizationData.dreamJob || "غير محدد"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    المكان المفضل
                  </label>
                  {isPersonalizationEditing ? (
                    <input
                      type="text"
                      name="favoritePlace"
                      value={personalizationData.favoritePlace}
                      onChange={handlePersonalizationChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      dir="rtl"
                      placeholder="مثال: مكتبة"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {personalizationData.favoritePlace || "غير محدد"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    هدف التعلم
                  </label>
                  {isPersonalizationEditing ? (
                    <input
                      type="text"
                      name="learningGoal"
                      value={personalizationData.learningGoal}
                      onChange={handlePersonalizationChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      dir="rtl"
                      placeholder="مثال: تحسين التحدث بالإنجليزية"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {personalizationData.learningGoal || "غير محدد"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الشخصية
                  </label>
                  {isPersonalizationEditing ? (
                    <select
                      name="personality"
                      value={personalizationData.personality}
                      onChange={handlePersonalizationChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">اختر الشخصية</option>
                      {personalityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {personalizationData.personality || "غير محدد"}
                    </p>
                  )}
                </div>
              </div>

              {isPersonalizationEditing && (
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handlePersonalizationSave}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    حفظ التخصيص
                  </button>
                  <button
                    onClick={() => setIsPersonalizationEditing(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>

            {/* Achievements */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                الإنجازات ({achievements.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.length > 0 ? (
                  achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="p-4 rounded-lg border-2 border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {achievement.achievement?.icon || "🏆"}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {achievement.achievement?.name ||
                              achievement.achievement?.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {achievement.achievement?.description}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            تم الحصول عليه في{" "}
                            {new Date(
                              achievement.achievedAt
                            ).toLocaleDateString("ar-SA")}
                          </p>
                        </div>
                        <div className="ml-auto">
                          <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-sm">✓</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <div className="text-4xl mb-4">🏆</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      لم تحصل على إنجازات بعد. استمر في التعلم!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">
                  {formData.name.charAt(0) || "U"}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {formData.name || "المستخدم"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {levelOptions.find((opt) => opt.value === formData.level)
                  ?.label || "غير محدد"}
              </p>
              <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                تغيير الصورة
              </button>
            </div>

            {/* Stats */}
            {user?.role === "USER" && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  إحصائياتي
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📅</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        أيام التعلم
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {stats.daysLearned}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📚</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        كلمات متعلمة
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {stats.wordsLearned}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📖</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        قصص مكتملة
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {stats.storiesCompleted}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🏆</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        نقاط الإنجاز
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {stats.achievementPoints}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Learned Words */}
            {user?.role === "USER" && learnedWords.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  الكلمات المتعلمة ({learnedWords.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {learnedWords.slice(0, 20).map((word, idx) => (
                    <span
                      key={idx}
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1 rounded-full text-sm"
                    >
                      {word.word || word.english}
                    </span>
                  ))}
                  {learnedWords.length > 20 && (
                    <span className="text-xs text-gray-500">والمزيد...</span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                إعدادات الحساب
              </h3>
              <div className="space-y-3">
                <button className="w-full text-right px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  تغيير كلمة المرور
                </button>
                <button className="w-full text-right px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  إعدادات الخصوصية
                </button>
                <button className="w-full text-right px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  تفضيلات الإشعارات
                </button>
                <hr className="my-3 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={logout}
                  className="w-full text-right px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
