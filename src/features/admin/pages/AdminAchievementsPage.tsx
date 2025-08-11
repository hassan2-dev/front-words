import React, { useState, useEffect } from "react";
import { apiClient } from "../../../core/utils/api";
import { API_ENDPOINTS } from "../../../core/config/api";
import { Loading } from "../../../presentation/components";

export const AdminAchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const fetchAchievements = async () => {
      setLoading(true);
      setError(null);
      try {
        const achievementsRes = await apiClient.get<any>(
          API_ENDPOINTS.ADMIN.ACHIEVEMENTS.LIST
        );

        if (achievementsRes.success && achievementsRes.data?.achievements) {
          const transformedAchievements = achievementsRes.data.achievements.map(
            (achievement: any) => ({
              id: achievement.id,
              name: achievement.name,
              description: achievement.description?.substring(0, 100) + "...",
              type: achievement.type || "general",
              points: achievement.points || 0,
              icon: achievement.icon || "🏆",
              createdAt: new Date(achievement.createdAt).toLocaleDateString(
                "ar-SA"
              ),
              status: achievement.isActive ? "نشط" : "غير نشط",
            })
          );
          setAchievements(transformedAchievements);
        }
      } catch (error: any) {
        console.error("Error fetching achievements:", error);
        if (
          error?.response?.status === 401 ||
          error?.response?.status === 403
        ) {
          setError("مشكلة في المصادقة. يرجى إعادة تسجيل الدخول.");
        } else {
          setError("حدث خطأ في تحميل بيانات الإنجازات");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  const filteredAchievements = achievements.filter((achievement) => {
    const matchesSearch =
      achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || achievement.type === filterType;

    return matchesSearch && matchesType;
  });

  const handleDeleteAchievement = async (achievementId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الإنجاز؟")) {
      try {
        const deleteRes = await apiClient.delete(
          API_ENDPOINTS.ADMIN.ACHIEVEMENTS.DELETE(achievementId)
        );
        if (deleteRes.success) {
          setAchievements(
            achievements.filter(
              (achievement) => achievement.id !== achievementId
            )
          );
          alert("تم حذف الإنجاز بنجاح");
        } else {
          alert("حدث خطأ في حذف الإنجاز");
        }
      } catch (error) {
        console.error("Error deleting achievement:", error);
        alert("حدث خطأ في حذف الإنجاز");
      }
    }
  };

  const handleToggleAchievementStatus = async (
    achievementId: string,
    currentStatus: string
  ) => {
    try {
      const newStatus = currentStatus === "نشط" ? false : true;
      const updateRes = await apiClient.put(
        API_ENDPOINTS.ADMIN.ACHIEVEMENTS.UPDATE(achievementId),
        {
          isActive: newStatus,
        }
      );
      if (updateRes.success) {
        setAchievements(
          achievements.map((achievement) =>
            achievement.id === achievementId
              ? { ...achievement, status: newStatus ? "نشط" : "غير نشط" }
              : achievement
          )
        );
        alert("تم تحديث حالة الإنجاز بنجاح");
      } else {
        alert("حدث خطأ في تحديث حالة الإنجاز");
      }
    } catch (error) {
      console.error("Error updating achievement status:", error);
      alert("حدث خطأ في تحديث حالة الإنجاز");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading
          variant="video"
          size="xl"
          text="جاري تحميل بيانات الإنجازات..."
          isOverlay
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            خطأ في التحميل
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          إدارة الإنجازات
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          عرض وإدارة جميع إنجازات المنصة
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="البحث عن إنجاز..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                🔍
              </div>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right"
            >
              <option value="all">جميع الأنواع</option>
              <option value="general">عام</option>
              <option value="words">الكلمات</option>
              <option value="stories">القصص</option>
              <option value="streak">التتابع</option>
              <option value="special">خاص</option>
            </select>
          </div>

          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap">
            إضافة إنجاز جديد
          </button>
        </div>

        {/* Achievements Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-right py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                  الإنجاز
                </th>
                <th className="text-right py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white text-xs sm:text-sm hidden md:table-cell">
                  الوصف
                </th>
                <th className="text-right py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white text-xs sm:text-sm hidden lg:table-cell">
                  النوع
                </th>
                <th className="text-right py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white text-xs sm:text-sm hidden xl:table-cell">
                  النقاط
                </th>
                <th className="text-right py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                  الحالة
                </th>
                <th className="text-right py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAchievements.length > 0 ? (
                filteredAchievements.map((achievement: any) => (
                  <tr
                    key={achievement.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="py-3 px-2 sm:px-4 text-gray-900 dark:text-white text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{achievement.icon}</span>
                        <div>
                          <p className="font-medium">{achievement.name}</p>
                          <p className="text-gray-600 dark:text-gray-400 sm:hidden text-xs">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-gray-600 dark:text-gray-400 text-xs sm:text-sm hidden md:table-cell">
                      {achievement.description}
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-gray-600 dark:text-gray-400 text-xs sm:text-sm hidden lg:table-cell">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          achievement.type === "general"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : achievement.type === "words"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : achievement.type === "stories"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                            : achievement.type === "streak"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        }`}
                      >
                        {achievement.type === "general"
                          ? "عام"
                          : achievement.type === "words"
                          ? "الكلمات"
                          : achievement.type === "stories"
                          ? "القصص"
                          : achievement.type === "streak"
                          ? "التتابع"
                          : "خاص"}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-gray-600 dark:text-gray-400 text-xs sm:text-sm hidden xl:table-cell">
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        {achievement.points} نقطة
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          achievement.status === "نشط"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {achievement.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div className="flex gap-1 sm:gap-2">
                        <button className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm">
                          تعديل
                        </button>
                        <button
                          onClick={() =>
                            handleToggleAchievementStatus(
                              achievement.id,
                              achievement.status
                            )
                          }
                          className={`text-xs sm:text-sm ${
                            achievement.status === "نشط"
                              ? "text-orange-600 hover:text-orange-700"
                              : "text-green-600 hover:text-green-700"
                          }`}
                        >
                          {achievement.status === "نشط" ? "إيقاف" : "تفعيل"}
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteAchievement(achievement.id)
                          }
                          className="text-red-600 hover:text-red-700 text-xs sm:text-sm"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {searchTerm || filterType !== "all"
                      ? "لا توجد نتائج للبحث المحدد"
                      : "لا توجد إنجازات حالياً"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            إجمالي الإنجازات: {achievements.length} | الإنجازات المطابقة للفلتر:{" "}
            {filteredAchievements.length}
          </p>
        </div>
      </div>
    </div>
  );
};
