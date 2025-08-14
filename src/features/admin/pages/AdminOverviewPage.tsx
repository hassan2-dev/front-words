import React, { useState, useEffect } from "react";
import { apiClient } from "../../../core/utils/api";
import { API_ENDPOINTS } from "../../../core/config/api";
import { Loading } from "../../../presentation/components";

export const AdminOverviewPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminOverview = async () => {
      setLoading(true);
      setError(null);
      try {
        // استخدام نقطة النهاية الصحيحة للنظرة العامة
        const overviewRes = await apiClient.get<any>(
          API_ENDPOINTS.ADMIN.OVERVIEW
        );
        if (overviewRes.success && overviewRes.data) {
          setStats(overviewRes.data);
        } else {
          // إذا لم تكن نقطة النهاية متاحة، استخدم الإحصائيات العامة
          const statsRes = await apiClient.get<any>(API_ENDPOINTS.ADMIN.STATS);
          if (statsRes.success && statsRes.data) setStats(statsRes.data);
        }

        // جلب المستخدمين الجدد
        const usersRes = await apiClient.get<any>(
          API_ENDPOINTS.ADMIN.USERS.LIST
        );
        if (usersRes.success && usersRes.data?.users) {
          const transformedUsers = usersRes.data.users.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.phone,
            joinDate: user.createdAt
              ? new Date(user.createdAt).toLocaleDateString("en-US")
              : "غير محدد",
            status:
              user.role === "ADMIN"
                ? "مدير"
                : user.role === "TRAINER"
                ? "مدرب"
                : "مستخدم",
          }));
          setRecentUsers(transformedUsers.slice(0, 5)); // عرض آخر 5 مستخدمين فقط
        }

        // بيانات النشاط الأخير (يمكن جلبها من API في المستقبل)
        setRecentActivity([
          {
            id: 1,
            user: "أحمد محمد",
            action: "أكمل درس جديد",
            time: "منذ 5 دقائق",
          },
          {
            id: 2,
            user: "فاطمة علي",
            action: "تعلمت 10 كلمات جديدة",
            time: "منذ 15 دقيقة",
          },
          {
            id: 3,
            user: "محمد حسن",
            action: "أكمل قصة يومية",
            time: "منذ ساعة",
          },
        ]);
      } catch (error: any) {
        console.error("Error fetching admin overview data:", error);
        if (
          error?.response?.status === 401 ||
          error?.response?.status === 403
        ) {
          setError("مشكلة في المصادقة. يرجى إعادة تسجيل الدخول.");
        } else {
          setError("حدث خطأ في تحميل البيانات");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAdminOverview();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading
          variant="video"
          size="xl"
          text="جاري تحميل البيانات..."
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
          نظرة عامة
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          إحصائيات شاملة عن المنصة والمستخدمين
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  إجمالي المستخدمين
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalUsers?.toLocaleString() ?? 0}
                </p>
              </div>
              <div className="text-2xl sm:text-3xl">👥</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  المستخدمون النشطون
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.activeUsers?.toLocaleString() ?? 0}
                </p>
              </div>
              <div className="text-2xl sm:text-3xl">🟢</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  إجمالي الكلمات
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalWords?.toLocaleString() ?? 0}
                </p>
              </div>
              <div className="text-2xl sm:text-3xl">📝</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  إجمالي القصص
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalStories?.toLocaleString() ?? 0}
                </p>
              </div>
              <div className="text-2xl sm:text-3xl">📖</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              المستخدمون الجدد
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {Array.isArray(recentUsers) && recentUsers.length > 0 ? (
                recentUsers.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1 min-w-0  ">
                      <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                        {user.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-left ml-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {user.joinDate}
                      </p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                          user.status === "مدير"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                            : user.status === "مدرب"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        }`}
                      >
                        {user.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  لا يوجد مستخدمون حالياً
                </p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              النشاط الأخير
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {recentActivity.map((activity: any) => (
                <div
                  key={activity.id}
                  className="border-r-2 border-blue-200 pr-3 sm:pr-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                    {activity.user}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {activity.time}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
