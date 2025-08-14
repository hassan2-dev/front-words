import React, { useState, useEffect } from "react";
import { apiClient } from "../../../core/utils/api";
import { API_ENDPOINTS } from "../../../core/config/api";
import { Loading } from "@/presentation/components";

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalStories: number;
  recentActivities: any[];
  studentsByLevel: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}

export const TrainerOverviewPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      try {
        const statsRes = await apiClient.get<DashboardStats>(
          API_ENDPOINTS.TRAINER.DASHBOARD.OVERVIEW
        );
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
      setLoading(false);
    };
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <Loading size="xl" variant="video" text="جاري تحميل الإحصائيات..." />
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          نظرة عامة
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          إحصائيات عامة وتقدم الطلاب
        </p>
      </div>

      {stats && (
        <>
          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl text-blue-500 mr-4">👨‍🎓</div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    إجمالي الطلاب
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalStudents}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl text-green-500 mr-4">✅</div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    الطلاب النشطون
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.activeStudents}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl text-purple-500 mr-4">📚</div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    إجمالي القصص
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalStories}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl text-orange-500 mr-4">📊</div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    معدل النشاط
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(
                      (stats.activeStudents / stats.totalStudents) * 100
                    )}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* توزيع الطلاب حسب المستوى */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                توزيع الطلاب حسب المستوى
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      مبتدئ
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {stats.studentsByLevel.beginner}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      متوسط
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {stats.studentsByLevel.intermediate}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      متقدم
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {stats.studentsByLevel.advanced}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                الأنشطة الأخيرة
              </h3>
              <div className="space-y-3">
                {stats.recentActivities.slice(0, 5).map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 space-x-reverse"
                  >
                    <div className="text-blue-500 text-lg">📝</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.date).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
