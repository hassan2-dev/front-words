import React from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../core/constants/app";
import { useAuth } from "../../../core/providers/AuthProvider";
export const TrainerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const quickActions = [
    {
      title: "نظرة عامة",
      description: "إحصائيات عامة وتقدم الطلاب",
      icon: "📊",
      href: ROUTES.TRAINER_DASHBOARD,
      color: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-900 dark:text-blue-100",
    },
    {
      title: "إدارة الطلاب",
      description: "عرض وإدارة تقدم جميع الطلاب",
      icon: "👨‍🎓",
      href: ROUTES.TRAINER_STUDENTS,
      color: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-900 dark:text-green-100",
    },
    {
      title: "القصص",
      description: "إنشاء وتعديل القصص",
      icon: "📚",
      href: ROUTES.TRAINER_STORIES,
      color: "bg-orange-50 dark:bg-orange-900/20",
      textColor: "text-orange-900 dark:text-orange-100",
    },
    {
      title: "الأنشطة",
      description: "مراقبة أنشطة الطلاب",
      icon: "📈",
      href: "/trainer/activities",
      color: "bg-purple-50 dark:bg-purple-900/20",
      textColor: "text-purple-900 dark:text-purple-100",
    },
    {
      title: "الإشعارات",
      description: "إدارة وإرسال الإشعارات",
      icon: "🔔",
      href: "/trainer/notifications",
      color: "bg-red-50 dark:bg-red-900/20",
      textColor: "text-red-900 dark:text-red-100",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          لوحة تحكم المدرب
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          مرحباً بك في لوحة تحكم المدرب - اختر ما تريد إدارته
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <div
            key={index}
            className={`${action.color} p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer`}
            onClick={() => navigate(action.href)}
          >
            <div className="text-4xl mb-4">{action.icon}</div>
            <h3 className={`text-lg font-semibold mb-2 ${action.textColor}`}>
              {action.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {action.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          نصائح سريعة للمدرب
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3 space-x-reverse">
            <div className="text-blue-500 text-lg">💡</div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                مراقبة التقدم
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                استخدم صفحة الطلاب لمراقبة تقدم كل طالب بشكل فردي
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 space-x-reverse">
            <div className="text-green-500 text-lg">📊</div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                التحليلات
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                راجع التحليلات لمعرفة أداء الطلاب بشكل عام
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 space-x-reverse">
            <div className="text-purple-500 text-lg">📚</div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                القصص
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                أنشئ قصص تعليمية جديدة لتحسين تجربة التعلم
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 space-x-reverse">
            <div className="text-orange-500 text-lg">🔔</div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                التواصل
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                أرسل إشعارات للطلاب لتشجيعهم وتحفيزهم
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
