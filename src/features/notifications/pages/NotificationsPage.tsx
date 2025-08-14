/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  apiClient,
  deleteNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  getUnreadNotificationsCount,
  getNotifications,
  getNotificationStats,
} from "../../../core/utils/api";
import { Loading } from "@/presentation/components";
import { API_ENDPOINTS } from "../../../core/config/api";

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // جلب الإشعارات
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getNotifications();
      console.log("Notifications response:", res);

      if (res.success && res.data) {
        const data = res.data as any;
        if (data.notifications && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        } else {
          console.log("No notifications found or invalid data structure");
          setNotifications([]);
        }
      } else {
        console.log("No notifications found or invalid data structure");
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    }
    setLoading(false);
  };

  // جلب عدد الإشعارات غير المقروءة
  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadNotificationsCount();
      if (res.success && res.data) {
        const data = res.data as any;
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // جلب إحصائيات الإشعارات
  const fetchNotificationStats = async () => {
    try {
      const res = await getNotificationStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error("Error fetching notification stats:", error);
    }
  };

  useEffect(() => {
    // التحميل الأولي
    fetchNotifications();
    fetchUnreadCount();
    fetchNotificationStats();

    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
      fetchNotificationStats();
    }, 30000);

    // تنظيف عند إلغاء المكون
    return () => clearInterval(interval);
  }, []);

  // Sync unread count to localStorage for MainLayout badge
  useEffect(() => {
    const calculatedUnreadCount = notifications.filter((n) => !n.isRead).length;
    localStorage.setItem(
      "unreadNotificationsCount",
      calculatedUnreadCount.toString()
    );
    setUnreadCount(calculatedUnreadCount);
  }, [notifications]);

  // تحديث عند العودة للصفحة
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNotifications();
        fetchUnreadCount();
      }
    };

    const handleFocus = () => {
      fetchNotifications();
      fetchUnreadCount();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const markAsRead = async (id: number) => {
    setActionLoading(`read-${id}`);
    try {
      await markNotificationAsRead(id.toString());
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
      await fetchUnreadCount();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const markAllAsRead = async () => {
    setActionLoading("mark-all");

    // تحديث فوري للواجهة
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
      // لا نحتاج لإعادة جلب البيانات لأننا حدثناها فورياً
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      // في حالة الخطأ، نعيد جلب البيانات
      await fetchNotifications();
      await fetchUnreadCount();
    } finally {
      setActionLoading(null);
    }
  };

  const deleteNotificationHandler = async (id: number) => {
    setActionLoading(`delete-${id}`);
    try {
      await deleteNotification(id.toString());
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
      await fetchUnreadCount();
    } catch (error) {
      console.error("Error deleting notification:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredNotifications = Array.isArray(notifications)
    ? notifications.filter((notification) => {
        if (filter === "unread") return !notification.isRead;
        if (filter === "read") return notification.isRead;
        return true;
      })
    : [];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "achievement":
        return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white";
      case "lesson":
        return "bg-gradient-to-r from-blue-400 to-purple-500 text-white";
      case "reminder":
        return "bg-gradient-to-r from-orange-400 to-red-500 text-white";
      case "system":
        return "bg-gradient-to-r from-gray-400 to-gray-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-600 text-white";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "achievement":
        return "🏆";
      case "lesson":
        return "📚";
      case "reminder":
        return "⏰";
      case "system":
        return "⚙️";
      default:
        return "🔔";
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "achievement":
        return "إنجاز";
      case "lesson":
        return "درس";
      case "reminder":
        return "تذكير";
      case "system":
        return "نظام";
      default:
        return "إشعار";
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInHours * 60);
        return `منذ ${diffInMinutes} دقيقة`;
      } else if (diffInHours < 24) {
        return `منذ ${Math.floor(diffInHours)} ساعة`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `منذ ${diffInDays} يوم`;
      }
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loading size="xl" variant="video" text="جاري تحميل الإشعارات..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header Section */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 border border-white/30 dark:border-gray-700/30">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-xl sm:text-2xl">🔔</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  الإشعارات
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
                  {unreadCount > 0
                    ? `لديك ${unreadCount} إشعار غير مقروء`
                    : "لا توجد إشعارات جديدة"}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={actionLoading === "mark-all"}
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
              >
                {actionLoading === "mark-all" ? (
                  <span className="flex items-center gap-2 sm:gap-3">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                    جاري التحديث...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="text-base sm:text-lg">✅</span>
                    تمييز الكل كمقروء
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Statistics Section */}
        {stats && (
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 border border-white/30 dark:border-gray-700/30">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl">📊</span>
              إحصائيات الإشعارات
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center border border-blue-200/50 dark:border-blue-700/50">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1 sm:mb-2">
                  {stats.total || 0}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  إجمالي الإشعارات
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 dark:from-green-500/20 dark:to-green-600/20 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center border border-green-200/50 dark:border-green-700/50">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-1 sm:mb-2">
                  {stats.read || 0}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  مقروءة
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 dark:from-orange-500/20 dark:to-orange-600/20 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center border border-orange-200/50 dark:border-orange-700/50">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1 sm:mb-2">
                  {stats.unread || 0}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  غير مقروءة
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 dark:from-purple-500/20 dark:to-purple-600/20 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center border border-purple-200/50 dark:border-purple-700/50">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1 sm:mb-2">
                  {stats.byType ? Object.keys(stats.byType).length : 0}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  أنواع مختلفة
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 border border-white/30 dark:border-gray-700/30">
          <div className="flex flex-wrap gap-2 sm:gap-4 justify-center lg:justify-start">
            {[
              {
                key: "all",
                label: "الكل",
                count: notifications.length,
                icon: "📋",
                color: "from-gray-500 to-gray-600",
              },
              {
                key: "unread",
                label: "غير مقروء",
                count: unreadCount,
                icon: "🔴",
                color: "from-red-500 to-pink-600",
              },
              {
                key: "read",
                label: "مقروء",
                count: notifications.length - unreadCount,
                icon: "✅",
                color: "from-green-500 to-emerald-600",
              },
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-lg ${
                  filter === filterOption.key
                    ? `bg-gradient-to-r ${filterOption.color} text-white shadow-xl`
                    : "bg-white/60 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/80 shadow-md hover:shadow-lg"
                }`}
              >
                <span className="text-lg sm:text-xl">{filterOption.icon}</span>
                <span className="text-sm sm:text-lg">{filterOption.label}</span>
                <span
                  className={`px-2 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold ${
                    filter === filterOption.key
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                  }`}
                >
                  {filterOption.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3 sm:space-y-6">
          {filteredNotifications.map((notification, index) => (
            <div
              key={notification.id}
              className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] sm:hover:scale-[1.02] border border-white/30 dark:border-gray-700/30 ${
                !notification.isRead
                  ? "ring-2 ring-blue-500/30 shadow-blue-500/20"
                  : ""
              } w-full`}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: "fadeInUp 0.6s ease-out forwards",
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex gap-3 sm:gap-6 flex-1">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg flex-shrink-0">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                      <h3
                        className={`font-bold text-lg sm:text-xl ${
                          !notification.isRead
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <span
                        className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold ${getTypeColor(
                          notification.type
                        )} w-fit`}
                      >
                        {getTypeName(notification.type)}
                      </span>
                      {!notification.isRead && (
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse shadow-lg"></div>
                      )}
                    </div>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 flex items-center gap-2 sm:gap-3">
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3 justify-end sm:justify-start">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      disabled={actionLoading === `read-${notification.id}`}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 disabled:opacity-50"
                    >
                      {actionLoading === `read-${notification.id}` ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-blue-600 border-t-transparent"></div>
                          جاري...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="text-base sm:text-lg">👁️</span>
                          تم القراءة
                        </span>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotificationHandler(notification.id)}
                    disabled={actionLoading === `delete-${notification.id}`}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 disabled:opacity-50"
                  >
                    {actionLoading === `delete-${notification.id}` ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-red-600 border-t-transparent"></div>
                        جاري...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="text-base sm:text-lg">🗑️</span>
                        حذف
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12 sm:py-20">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl">
              <span className="text-4xl sm:text-6xl">🔔</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              لا توجد إشعارات
            </h3>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {filter === "unread"
                ? "جميع إشعاراتك مقروءة"
                : filter === "read"
                ? "لا توجد إشعارات مقروءة"
                : "لا توجد إشعارات متاحة"}
            </p>
            <div className="mt-6 sm:mt-8">
              <div className="w-12 h-1 sm:w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
