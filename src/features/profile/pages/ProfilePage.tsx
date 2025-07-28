import React, { useState, useEffect } from "react";
import { useAuth } from "../../../core/providers/AuthProvider";
import { apiClient } from "../../../core/utils/api";
import { ENDPOINTS } from "../../../core/config/api";
import { getLearnedWords } from "../../../core/utils/api";

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: user?.name || "أحمد محمد",
    email: user?.email || "ahmed@example.com",
    phone: "",
    birthDate: "",
    level: "متوسط",
    goal: "تحسين اللغة الإنجليزية للعمل",
  });
  const [learnedWords, setLearnedWords] = useState<any[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const res = await apiClient.get<any>(ENDPOINTS.AUTH.ME);
      if (res.success && res.data) {
        setFormData({
          name: res.data.name || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          birthDate: res.data.birthDate || "",
          level: res.data.level || "متوسط",
          goal: res.data.goal || "",
        });
      }
      setLoading(false);
    };
    fetchProfile();
    // جلب الكلمات المتعلمة
    const fetchLearned = async () => {
      const res = await getLearnedWords();
      if (res.success && res.data && Array.isArray(res.data.words)) {
        setLearnedWords(res.data.words);
      }
    };
    fetchLearned();
  }, []);

  const handleSave = () => {
    // Save profile logic here
    setIsEditing(false);
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

  const stats = [
    { label: "أيام التعلم", value: "45", icon: "📅" },
    { label: "كلمات متعلمة", value: "324", icon: "📚" },
    { label: "قصص مكتملة", value: "12", icon: "📖" },
    { label: "نقاط الإنجاز", value: "1,250", icon: "🏆" },
  ];

  const achievements = [
    {
      id: 1,
      title: "المبتدئ المجتهد",
      description: "أكمل أول 10 دروس",
      icon: "🎯",
      earned: true,
    },
    {
      id: 2,
      title: "عاشق الكلمات",
      description: "تعلم 100 كلمة جديدة",
      icon: "💝",
      earned: true,
    },
    {
      id: 3,
      title: "قارئ نهم",
      description: "اقرأ 5 قصص",
      icon: "📚",
      earned: true,
    },
    {
      id: 4,
      title: "المثابر",
      description: "7 أيام متتالية",
      icon: "🔥",
      earned: false,
    },
    {
      id: 5,
      title: "الخبير",
      description: "انهي 50 درساً",
      icon: "👨‍🎓",
      earned: false,
    },
    {
      id: 6,
      title: "النجم المتصاعد",
      description: "احصل على 2000 نقطة",
      icon: "⭐",
      earned: false,
    },
  ];

  if (loading) return <div>جاري تحميل البيانات...</div>;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          الملف الشخصي
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          إدارة معلوماتك الشخصية وتتبع تقدمك
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                المعلومات الشخصية
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    dir="rtl"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.name}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    dir="rtl"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.email}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    dir="rtl"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.phone}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.birthDate}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="مبتدئ">مبتدئ</option>
                    <option value="متوسط">متوسط</option>
                    <option value="متقدم">متقدم</option>
                  </select>
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.level}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الهدف من التعلم
                </label>
                {isEditing ? (
                  <textarea
                    name="goal"
                    value={formData.goal}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    dir="rtl"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.goal}
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

          {/* Achievements */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              الإنجازات
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    achievement.earned
                      ? "border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
                      : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-2xl ${
                        achievement.earned ? "" : "grayscale opacity-50"
                      }`}
                    >
                      {achievement.icon}
                    </div>
                    <div>
                      <h3
                        className={`font-medium ${
                          achievement.earned
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {achievement.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {achievement.description}
                      </p>
                    </div>
                    {achievement.earned && (
                      <div className="ml-auto">
                        <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm">✓</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-blue-600 text-3xl font-bold">
                {formData.name.charAt(0)}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {formData.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {formData.level}
            </p>
            <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
              تغيير الصورة
            </button>
          </div>

          {/* Stats */}
          {user?.role === "USER" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                إحصائياتي
              </h3>
              <div className="space-y-4">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{stat.icon}</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {stat.label}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learned Words */}
          {user?.role === "USER" && learnedWords.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
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
  );
};
