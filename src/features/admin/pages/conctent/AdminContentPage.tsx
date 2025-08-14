/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../../../core/utils/api";
import { API_ENDPOINTS } from "../../../../core/config/api";
import { Loading } from "../../../../presentation/components";

export const AdminContentPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>("words");
  const [contentStats, setContentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contentSections = [
    {
      key: "words",
      title: "إدارة الكلمات",
      icon: "📝",
      description: "إضافة وتعديل الكلمات والمفردات",
      stats: {
        total: contentStats?.totalWords || 0,
        active: contentStats?.activeWords || 0,
        draft: contentStats?.draftWords || 0,
      },
      path: "/admin/content/words",
    },
    {
      key: "stories",
      title: "إدارة القصص",
      icon: "📖",
      description: "إدارة القصص اليومية والقصص التعليمية",
      stats: {
        total: contentStats?.totalStories || 0,
        active: contentStats?.activeStories || 0,
        draft: contentStats?.draftStories || 0,
      },
      path: "/admin/content/stories",
    },
  ];

  useEffect(() => {
    const fetchContentStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // جلب إحصائيات المحتوى
        const wordsRes = await apiClient.get<any>(
          API_ENDPOINTS.ADMIN.CONTENT.WORDS.LIST
        );
        const storiesRes = await apiClient.get<any>(
          API_ENDPOINTS.ADMIN.CONTENT.STORIES.LIST
        );

        const stats = {
          totalWords: wordsRes.success ? wordsRes.data?.words?.length || 0 : 0,
          activeWords: wordsRes.success
            ? wordsRes.data?.words?.filter((w: any) => w.isActive)?.length || 0
            : 0,
          draftWords: wordsRes.success
            ? wordsRes.data?.words?.filter((w: any) => !w.isActive)?.length || 0
            : 0,
          totalStories: storiesRes.success
            ? storiesRes.data?.stories?.length || 0
            : 0,
          activeStories: storiesRes.success
            ? storiesRes.data?.stories?.filter((s: any) => s.isActive)
                ?.length || 0
            : 0,
          draftStories: storiesRes.success
            ? storiesRes.data?.stories?.filter((s: any) => !s.isActive)
                ?.length || 0
            : 0,
        };

        setContentStats(stats);
      } catch (error: any) {
        console.error("Error fetching content stats:", error);
        setError("حدث خطأ في تحميل إحصائيات المحتوى");
      } finally {
        setLoading(false);
      }
    };

    fetchContentStats();
  }, []);

  const renderContentSection = (sectionKey: string) => {
    switch (sectionKey) {
      case "words":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                إدارة الكلمات
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                يمكنك إدارة جميع الكلمات والمفردات في المنصة من خلال هذه الصفحة.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate("/admin/content/words")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  عرض جميع الكلمات
                </button>
                <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  إضافة كلمة جديدة
                </button>
              </div>
            </div>
          </div>
        );

      case "stories":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                إدارة القصص
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                يمكنك إدارة جميع القصص التعليمية والقصص اليومية في المنصة.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate("/admin/content/stories")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  عرض جميع القصص
                </button>
                <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  إضافة قصة جديدة
                </button>
              </div>
            </div>
          </div>
        );

      case "words":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                الكلمات والمفردات
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                        الكلمة
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                        المعنى
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                        المستوى
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { word: "مرحبا", meaning: "Hello", level: "مبتدئ" },
                      { word: "شكرا", meaning: "Thank you", level: "مبتدئ" },
                      { word: "أهلا", meaning: "Welcome", level: "مبتدئ" },
                    ].map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 dark:border-gray-700"
                      >
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          {item.word}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {item.meaning}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            {item.level}
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
          </div>
        );

      case "exercises":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                التمارين والاختبارات
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((exercise) => (
                  <div
                    key={exercise}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        تمرين {exercise}
                      </h4>
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        مسودة
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      وصف التمرين ونوعه
                    </p>
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-700 text-sm">
                        تعديل
                      </button>
                      <button className="text-green-600 hover:text-green-700 text-sm">
                        نشر
                      </button>
                      <button className="text-red-600 hover:text-red-700 text-sm">
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading
          variant="video"
          size="xl"
          text="جاري تحميل إحصائيات المحتوى..."
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
          إدارة المحتوى
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          إدارة جميع المحتويات التعليمية في المنصة
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Content Sections Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contentSections.map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`p-4 border rounded-lg transition-colors text-right ${
                activeSection === section.key
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <div className="text-2xl mb-2">{section.icon}</div>
              <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base mb-1">
                {section.title}
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
                {section.description}
              </p>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>إجمالي: {section.stats.total}</span>
                <span>نشط: {section.stats.active}</span>
                <span>مسودة: {section.stats.draft}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Active Section Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                {contentSections.find((s) => s.key === activeSection)?.title}
              </h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
                إضافة جديد
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {renderContentSection(activeSection)}
          </div>
        </div>
      </div>
    </div>
  );
};
