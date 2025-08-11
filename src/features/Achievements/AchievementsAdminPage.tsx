import React, { useEffect, useState } from "react";
import {
  getAllAchievements,
  addAchievement,
  updateAchievement,
  deleteAchievement,
  getAchievementTypes,
  getUserAchievements,
} from "../../core/utils/api";
import type {
  Achievement,
  AchievementType,
  UserAchievement,
} from "../../core/types";
import { Loading } from "@/presentation/components";

// مكتبة الأيقونات
const ICON_LIBRARY = [
  "🏆",
  "🥇",
  "🥈",
  "🥉",
  "⭐",
  "🌟",
  "💎",
  "🔥",
  "⚡",
  "🎯",
  "🎪",
  "🎨",
  "🎭",
  "🎪",
  "🎯",
  "🎲",
  "🎮",
  "🎸",
  "🎹",
  "🎺",
  "🎻",
  "🎤",
  "🎧",
  "🎬",
  "📚",
  "📖",
  "📝",
  "✏️",
  "🖊️",
  "🖋️",
  "📌",
  "📍",
  "🔖",
  "📎",
  "📐",
  "📏",
  "🧮",
  "🔢",
  "🔤",
  "🔡",
  "🔠",
  "📱",
  "💻",
  "🖥️",
  "⌨️",
  "🖱️",
  "💾",
  "💿",
  "🌍",
  "🌎",
  "🌏",
  "🌐",
  "🗺️",
  "🧭",
  "⏰",
  "⏱️",
  "⏲️",
  "🕐",
  "🕑",
  "🕒",
  "🎉",
  "🎊",
  "🎈",
  "🎂",
  "🎁",
  "🎀",
  "🎗️",
  "🏅",
  "🎖️",
  "🏆",
  "🥇",
  "🥈",
  "💪",
  "🧠",
  "👁️",
  "👂",
  "👃",
  "👄",
  "👅",
  "🦷",
  "🦴",
  "🦵",
  "🦶",
  "🦿",
  "🌱",
  "🌲",
  "🌳",
  "🌴",
  "🌵",
  "🌾",
  "🌿",
  "☘️",
  "🍀",
  "🍁",
  "🍂",
  "🍃",
  "🌺",
  "🌸",
  "🌼",
  "🌻",
  "🌞",
  "🌝",
  "🌛",
  "🌜",
  "🌚",
  "🌕",
  "🌖",
  "🌗",
  "🚀",
  "🛸",
  "🛰️",
  "🛥️",
  "🚁",
  "🛩️",
  "✈️",
  "🛫",
  "🛬",
  "🛎️",
  "🚪",
  "🛏️",
];

// أنواع الإنجازات
const ACHIEVEMENT_TYPES = [
  { value: "stories", label: "القصص", icon: "📚" },
  { value: "words", label: "الكلمات", icon: "🔤" },
  { value: "streak", label: "التتابع", icon: "🔥" },
  { value: "lessons", label: "الدروس", icon: "📖" },
  { value: "exams", label: "الاختبارات", icon: "📝" },
  { value: "chat", label: "المحادثات", icon: "💬" },
];
// أنواع الأهداف
const TARGET_TYPES = [
  { value: "stories", label: "القصص", icon: "📚" },
  { value: "words", label: "الكلمات", icon: "🔤" },
  { value: "streak", label: "التتابع", icon: "🔥" },
  { value: "lessons", label: "الدروس", icon: "📖" },
  { value: "exams", label: "الاختبارات", icon: "📝" },
  { value: "chat", label: "المحادثات", icon: "💬" },
];

export const AchievementsAdminPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"achievements" | "types">(
    "achievements"
  );
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [types, setTypes] = useState<AchievementType[]>([
    {
      id: "1",
      name: "الإنجازات",
      description: "الإنجازات",
      icon: "🏆",
    },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Achievement>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>(
    []
  );
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [targetType, setTargetType] = useState("stories");

  // جلب جميع البيانات
  const fetchData = async () => {
    setLoading(true);

    // جلب الإنجازات
    const achievementsRes = await getAllAchievements();
    if (achievementsRes.success && achievementsRes.data) {
      setAchievements(achievementsRes.data as unknown as Achievement[]);
    } else {
      setAchievements([]);
    }

    // جلب أنواع الإنجازات
    const typesRes = await getAchievementTypes();
    if (typesRes.success && typesRes.data) {
      setTypes(typesRes.data as unknown as AchievementType[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // إضافة أو تعديل إنجاز
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      await updateAchievement(editId, form);
    } else {
      await addAchievement(form);
    }
    setShowForm(false);
    setForm({});
    setEditId(null);
    fetchData();
  };

  // حذف إنجاز
  const handleDelete = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الإنجاز؟")) {
      await deleteAchievement(id);
      fetchData();
    }
  };

  // تعبئة النموذج للتعديل
  const handleEdit = (ach: Achievement) => {
    setForm(ach);
    setEditId(ach.id);
    setShowForm(true);
  };

  // جلب إنجازات مستخدم
  const handleFetchUserAchievements = async () => {
    if (!selectedUserId) return;

    const res = await getUserAchievements(selectedUserId);
    if (res.success && res.data) {
      setUserAchievements(res.data as unknown as UserAchievement[]);
    }
  };

  const renderAchievements = () => (
    <div>
      <div className="mb-8">
        <button
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
          onClick={() => {
            setForm({});
            setEditId(null);
            setShowForm(true);
            setShowIconPicker(false);
          }}
        >
          <span className="text-xl">✨</span>
          <span>إضافة إنجاز جديد</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 border border-white/30 dark:border-gray-700/30">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {editId ? "تعديل الإنجاز" : "إضافة إنجاز جديد"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* اسم الإنجاز */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                اسم الإنجاز *
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                placeholder="مثال: قارئ القصص المتميز"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            {/* وصف الإنجاز */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                وصف الإنجاز *
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 resize-none"
                placeholder="وصف مفصل للإنجاز..."
                rows={3}
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
              />
            </div>

            {/* نوع الإنجاز */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نوع الإنجاز *
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                value={form.type || ""}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                required
              >
                <option value="">اختر نوع الإنجاز</option>
                {ACHIEVEMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* نوع الهدف */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نوع الهدف *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {TARGET_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setTargetType(type.value)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      targetType === type.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300"
                    }`}
                  >
                    <span className="text-lg">{type.icon}</span>
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* قيمة الهدف */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                قيمة الهدف *
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                placeholder={`عدد ${
                  TARGET_TYPES.find((t) => t.value === targetType)?.label
                }`}
                type="number"
                min="1"
                value={form.target || ""}
                onChange={(e) =>
                  setForm({ ...form, target: Number(e.target.value) })
                }
                required
              />
            </div>

            {/* النقاط */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                النقاط (1-100) *
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                placeholder="عدد النقاط"
                type="number"
                min="1"
                max="100"
                value={form.points || ""}
                onChange={(e) =>
                  setForm({ ...form, points: Number(e.target.value) })
                }
                required
              />
            </div>

            {/* اختيار الأيقونة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الأيقونة
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 transition-all duration-200"
                >
                  <span className="text-2xl">{form.icon || "🏆"}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {form.icon ? "تغيير الأيقونة" : "اختيار أيقونة"}
                  </span>
                </button>
                {form.icon && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, icon: "" })}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    إزالة
                  </button>
                )}
              </div>

              {/* مكتبة الأيقونات */}
              {showIconPicker && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border">
                  <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                    {ICON_LIBRARY.map((icon, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, icon });
                          setShowIconPicker(false);
                        }}
                        className="w-10 h-10 text-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors duration-200 flex items-center justify-center"
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* أزرار التحكم */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {editId ? "تحديث الإنجاز" : "إضافة الإنجاز"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm({});
                  setEditId(null);
                  setShowIconPicker(false);
                }}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              لا توجد إنجازات حالياً
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              ابدأ بإنشاء أول إنجاز للمنصة
            </p>
            <button
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
              onClick={() => {
                setForm({});
                setEditId(null);
                setShowForm(true);
                setShowIconPicker(false);
              }}
            >
              إنشاء أول إنجاز
            </button>
          </div>
        ) : (
          achievements.map((ach) => (
            <div
              key={ach.id}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/30 dark:border-gray-700/30 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              {/* الأيقونة والعنوان */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl">{ach.icon || "🏆"}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                    {ach.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {ach.type}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      {ach.points} نقطة
                    </span>
                  </div>
                </div>
              </div>

              {/* الوصف */}
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                {ach.description}
              </p>

              {/* التفاصيل */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    الهدف:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {ach.target}
                  </span>
                </div>
              </div>

              {/* أزرار التحكم */}
              <div className="flex gap-2">
                <button
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 text-sm"
                  onClick={() => handleEdit(ach)}
                >
                  تعديل
                </button>
                <button
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 text-sm"
                  onClick={() => handleDelete(ach.id)}
                >
                  حذف
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderTypes = () => (
    <div className="space-y-4">
      {types.map((type) => (
        <div
          key={type.id}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg flex items-center gap-4"
        >
          <div className="text-2xl">{type.icon}</div>
          <div>
            <div className="font-bold text-lg">{type.name}</div>
            <div className="text-gray-600 dark:text-gray-400">
              {type.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 border border-white/30 dark:border-gray-700/30">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🛠️</span>
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                إدارة الإنجازات
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                أنشئ، عدّل، واحذف تعريفات الإنجازات. المنح يتم تلقائياً من
                الخادم.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 mb-8 border border-white/30 dark:border-gray-700/30">
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
            {[
              {
                key: "achievements",
                label: "الإنجازات",
                icon: "🏆",
                color: "from-yellow-500 to-orange-600",
              },

              {
                key: "types",
                label: "أنواع الإنجازات",
                icon: "📋",
                color: "from-blue-500 to-indigo-600",
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                  activeTab === tab.key
                    ? `bg-gradient-to-r ${tab.color} text-white`
                    : "bg-white/70 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-white"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loading
              size="xl"
              variant="video"
              text="جاري تحميل البيانات..."
              isOverlay
            />
          </div>
        ) : (
          <div className="min-h-[420px]">
            {activeTab === "achievements" && renderAchievements()}
            {activeTab === "types" && renderTypes()}
          </div>
        )}
      </div>
    </div>
  );
};
