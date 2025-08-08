import React, { useState, useEffect } from "react";
import { apiClient } from "../../../core/utils/api";
import { API_ENDPOINTS } from "../../../core/config/api";
import { AchievementsAdminPage } from "../../Achievements/AchievementsAdminPage";
import { Loading } from "../../../presentation/components";

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [stats, setStats] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      setLoading(true);
      const statsRes = await apiClient.get<any>(API_ENDPOINTS.ADMIN.STATS);
      const usersRes = await apiClient.get<any[]>(API_ENDPOINTS.ADMIN.USERS.LIST);
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (usersRes.success && usersRes.data) setRecentUsers(usersRes.data);
      if (activityRes.success && activityRes.data)
        setRecentActivity(activityRes.data);
      setLoading(false);
    };
    fetchAdminDashboard();
  }, []);

  const tabs = [
    { key: "overview", label: "نظرة عامة", icon: "📊" },
    { key: "users", label: "المستخدمون", icon: "👥" },
    { key: "content", label: "المحتوى", icon: "📚" },
    { key: "achievements", label: "الإنجازات", icon: "🏆" },
    { key: "analytics", label: "التحليلات", icon: "📈" },
    { key: "settings", label: "الإعدادات", icon: "⚙️" },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                إجمالي المستخدمين
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalUsers?.toLocaleString() ?? 0}
              </p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                المستخدمون النشطون
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.activeUsers?.toLocaleString() ?? 0}
              </p>
            </div>
            <div className="text-3xl">🟢</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                إجمالي الدروس
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalLessons?.toLocaleString() ?? 0}
              </p>
            </div>
            <div className="text-3xl">📚</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                الدروس المكتملة
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.completedLessons?.toLocaleString() ?? 0}
              </p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            المستخدمون الجدد
          </h3>
          <div className="space-y-4">
            {recentUsers.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.joinDate}
                  </p>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === "نشط"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            النشاط الأخير
          </h3>
          <div className="space-y-4">
            {recentActivity.map((activity: any) => (
              <div
                key={activity.id}
                className="border-r-2 border-blue-200 pr-4"
              >
                <p className="font-medium text-gray-900 dark:text-white">
                  {activity.user}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
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
  );

  const renderUsers = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          إدارة المستخدمين
        </h3>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
          إضافة مستخدم جديد
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                الاسم
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                البريد الإلكتروني
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                تاريخ التسجيل
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                الحالة
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((user: any) => (
              <tr
                key={user.id}
                className="border-b border-gray-100 dark:border-gray-700"
              >
                <td className="py-3 px-4 text-gray-900 dark:text-white">
                  {user.name}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                  {user.email}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                  {user.joinDate}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === "نشط"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-700 text-sm">
                      تعديل
                    </button>
                    <button className="text-red-600 hover:text-red-700 text-sm">
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          إدارة المحتوى
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-right">
            <div className="text-2xl mb-2">📚</div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              إدارة الدروس
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              إضافة وتعديل الدروس
            </p>
          </button>

          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-right">
            <div className="text-2xl mb-2">📖</div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              إدارة القصص
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              إضافة وتعديل القصص
            </p>
          </button>

          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-right">
            <div className="text-2xl mb-2">📝</div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              إدارة الكلمات
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              إضافة وتعديل الكلمات
            </p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderAchievements = () => <AchievementsAdminPage />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading
          variant="video"
          size="xl"
          text="جاري تحميل بيانات الأدمن..."
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          لوحة تحكم المدير
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          إدارة شاملة للمنصة والمستخدمين
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.key
                    ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "users" && renderUsers()}
        {activeTab === "content" && renderContent()}
        {activeTab === "achievements" && renderAchievements()}
        {activeTab === "analytics" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              صفحة التحليلات
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              تحليلات مفصلة ستكون متاحة قريباً
            </p>
          </div>
        )}
        {activeTab === "settings" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <div className="text-6xl mb-4">⚙️</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              إعدادات النظام
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              إعدادات النظام والتكوين
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
