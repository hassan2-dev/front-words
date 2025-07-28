import React, { useEffect, useState } from "react";
import {
  getAllAchievements,
  addAchievement,
  updateAchievement,
  deleteAchievement,
  getAchievementStats,
  getAchievementTypes,
  getUserAchievements,
  resetUserAchievements,
} from "../../core/utils/api";
import { useAuth } from "../../core/providers/AuthProvider";
import type {
  Achievement,
  AchievementStats,
  AchievementType,
  UserAchievement,
} from "../../core/types";

export const AchievementsAdminPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "achievements" | "stats" | "types" | "users"
  >("achievements");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [types, setTypes] = useState<AchievementType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Achievement>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>(
    []
  );

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

    // جلب الإحصائيات
    const statsRes = await getAchievementStats();
    if (statsRes.success && statsRes.data) {
      setStats(statsRes.data as unknown as AchievementStats);
    } else {
      setStats(null);
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

  // صلاحية الأدمن أو المدرب فقط
  if (user?.role !== "ADMIN" && user?.role !== "TRAINER") {
    return (
      <div className="text-center py-12 text-red-600 font-bold">
        غير مصرح لك بالوصول إلى هذه الصفحة.
      </div>
    );
  }

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

  // إعادة تعيين إنجازات مستخدم
  const handleResetUserAchievements = async () => {
    if (!selectedUserId) return;

    if (window.confirm("هل أنت متأكد من إعادة تعيين إنجازات هذا المستخدم؟")) {
      await resetUserAchievements(selectedUserId);
      handleFetchUserAchievements();
    }
  };

  const renderAchievements = () => (
    <div>
      <button
        className="mb-6 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg"
        onClick={() => {
          setForm({});
          setEditId(null);
          setShowForm(true);
        }}
      >
        + إضافة إنجاز جديد
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8 space-y-4"
        >
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="اسم الإنجاز"
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="وصف الإنجاز"
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <select
            className="w-full border px-3 py-2 rounded"
            value={form.type || ""}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            required
          >
            <option value="">اختر نوع الإنجاز</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="الهدف (عدد القصص/الكلمات)"
            type="number"
            value={form.target || ""}
            onChange={(e) =>
              setForm({ ...form, target: Number(e.target.value) })
            }
            required
          />
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="النقاط"
            type="number"
            value={form.points || ""}
            onChange={(e) =>
              setForm({ ...form, points: Number(e.target.value) })
            }
            required
          />
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="رابط الأيقونة (اختياري)"
            value={form.icon || ""}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
          />
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
            >
              {editId ? "تعديل" : "إضافة"}
            </button>
            <button
              type="button"
              className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg"
              onClick={() => {
                setShowForm(false);
                setForm({});
                setEditId(null);
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-6">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className="rounded-xl p-5 shadow-lg flex items-center gap-4 bg-white dark:bg-gray-800"
          >
            <div className="flex-shrink-0 text-3xl">
              {ach.icon ? (
                <img src={ach.icon} alt="" className="w-10 h-10" />
              ) : (
                "🏆"
              )}
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg mb-1">{ach.name}</div>
              <div className="text-gray-600 dark:text-gray-400 mb-1">
                {ach.description}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                النوع: {ach.type} | الهدف: {ach.target} | النقاط: {ach.points}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-4 rounded"
                onClick={() => handleEdit(ach)}
              >
                تعديل
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-4 rounded"
                onClick={() => handleDelete(ach.id)}
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="space-y-6">
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalUsers}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                إجمالي المستخدمين
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.totalAchievements}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                إجمالي الإنجازات
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.averagePoints}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                متوسط النقاط
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-4">أفضل الإنجازات</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.topAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="text-2xl">{achievement.icon || "🏆"}</div>
                  <div>
                    <div className="font-medium">{achievement.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {achievement.points} نقطة
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
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

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4">إدارة إنجازات المستخدمين</h3>
        <div className="flex gap-4 mb-4">
          <input
            className="flex-1 border px-3 py-2 rounded"
            placeholder="أدخل معرف المستخدم"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
            onClick={handleFetchUserAchievements}
          >
            جلب الإنجازات
          </button>
          <button
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg"
            onClick={handleResetUserAchievements}
            disabled={!selectedUserId}
          >
            إعادة تعيين
          </button>
        </div>
      </div>

      {userAchievements.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-bold">إنجازات المستخدم</h4>
          {userAchievements.map((userAchievement) => (
            <div
              key={userAchievement.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg flex items-center gap-4"
            >
              <div className="text-2xl">🏆</div>
              <div className="flex-1">
                <div className="font-bold text-lg">
                  {userAchievement.achievement.name}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  {userAchievement.achievement.description}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  تم تحقيقه:{" "}
                  {new Date(userAchievement.achievedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {userAchievement.achievement.points} نقطة
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-700 dark:text-blue-300">
        إدارة الإنجازات
      </h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {[
          { key: "achievements", label: "الإنجازات", icon: "🏆" },
          { key: "stats", label: "الإحصائيات", icon: "📊" },
          { key: "types", label: "أنواع الإنجازات", icon: "📋" },
          { key: "users", label: "إدارة المستخدمين", icon: "👥" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">جاري تحميل البيانات...</div>
      ) : (
        <div className="min-h-[400px]">
          {activeTab === "achievements" && renderAchievements()}
          {activeTab === "stats" && renderStats()}
          {activeTab === "types" && renderTypes()}
          {activeTab === "users" && renderUsers()}
        </div>
      )}
    </div>
  );
};
