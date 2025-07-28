import React, { useState, useEffect } from "react";
import { apiClient } from "../../../core/utils/api";
import { ENDPOINTS } from "../../../core/config/api";

export const TrainerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [stats, setStats] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrainerDashboard = async () => {
      setLoading(true);
      const statsRes = await apiClient.get<any>(ENDPOINTS.TRAINER.DASHBOARD);
      const studentsRes = await apiClient.get<any[]>(
        ENDPOINTS.TRAINER.STUDENTS
      );
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (studentsRes.success && studentsRes.data)
        setStudents(studentsRes.data);
      setLoading(false);
    };
    fetchTrainerDashboard();
  }, []);

  const tabs = [
    { key: "overview", label: "نظرة عامة", icon: "📊" },
    { key: "students", label: "الطلاب", icon: "👨‍🎓" },
    { key: "courses", label: "الدورات", icon: "📚" },
    { key: "assignments", label: "الواجبات", icon: "📝" },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                إجمالي الطلاب
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalStudents ?? 0}
              </p>
            </div>
            <div className="text-3xl">👨‍🎓</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                الطلاب النشطون
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.activeStudents ?? 0}
              </p>
            </div>
            <div className="text-3xl">🟢</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                الدورات المنشأة
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.coursesCreated ?? 0}
              </p>
            </div>
            <div className="text-3xl">📚</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                متوسط التقدم
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.avgProgress ?? 0}%
              </p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          الطلاب الأحدث
        </h3>
        <div className="space-y-4">
          {students.map((student: any) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {student.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  المستوى: {student.level}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  التقدم
                </p>
                <p className="font-bold text-blue-600 dark:text-blue-400">
                  {student.progress}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  آخر نشاط
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {student.lastActive}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) return <div>جاري تحميل بيانات المدرب...</div>;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          لوحة تحكم المدرب
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          إدارة الطلاب والدورات التدريبية
        </p>
      </div>

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

      <div>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "students" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <div className="text-6xl mb-4">👨‍🎓</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              إدارة الطلاب
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              عرض وإدارة تقدم جميع الطلاب
            </p>
          </div>
        )}
        {activeTab === "courses" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              إدارة الدورات
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              إنشاء وتعديل المحتوى التعليمي
            </p>
          </div>
        )}
        {activeTab === "assignments" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              الواجبات والتقييمات
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              إنشاء وتصحيح الواجبات
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
