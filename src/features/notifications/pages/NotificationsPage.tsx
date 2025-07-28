import React, { useState, useEffect } from "react";
import { apiClient } from "../../../core/utils/api";
import { ENDPOINTS } from "../../../core/config/api";

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<any>(ENDPOINTS.NOTIFICATIONS.LIST);
        console.log("Notifications response:", res);

        if (
          res.success &&
          res.data &&
          res.data.notifications &&
          Array.isArray(res.data.notifications)
        ) {
          setNotifications(res.data.notifications);
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

    // التحميل الأولي
    fetchNotifications();

    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(fetchNotifications, 30000);

    // تنظيف عند إلغاء المكون
    return () => clearInterval(interval);
  }, []);

  // Sync unread count to localStorage for MainLayout badge
  useEffect(() => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    localStorage.setItem("unreadNotificationsCount", unreadCount.toString());
  }, [notifications]);

  // تحديث عند العودة للصفحة
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // تحديث الإشعارات عند العودة للصفحة
        const fetchNotifications = async () => {
          try {
            const res = await apiClient.get<any>(ENDPOINTS.NOTIFICATIONS.LIST);
            if (
              res.success &&
              res.data &&
              res.data.notifications &&
              Array.isArray(res.data.notifications)
            ) {
              setNotifications(res.data.notifications);
            }
          } catch (error) {
            console.error(
              "Error fetching notifications on visibility change:",
              error
            );
          }
        };
        fetchNotifications();
      }
    };

    const handleFocus = () => {
      // تحديث الإشعارات عند التركيز على النافذة
      const fetchNotifications = async () => {
        try {
          const res = await apiClient.get<any>(ENDPOINTS.NOTIFICATIONS.LIST);
          if (
            res.success &&
            res.data &&
            res.data.notifications &&
            Array.isArray(res.data.notifications)
          ) {
            setNotifications(res.data.notifications);
          }
        } catch (error) {
          console.error("Error fetching notifications on focus:", error);
        }
      };
      fetchNotifications();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const filteredNotifications = Array.isArray(notifications)
    ? notifications.filter((notification) => {
        if (filter === "unread") return !notification.isRead;
        if (filter === "read") return notification.isRead;
        return true;
      })
    : [];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            جاري تحميل الإشعارات...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-6">
        {/* Header Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border border-white/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-y-4 gap-x-8">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  الإشعارات
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {unreadCount > 0
                    ? `لديك ${unreadCount} إشعار غير مقروء`
                    : "لا توجد إشعارات جديدة"}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl w-full sm:w-auto"
              >
                تمييز الكل كمقروء
              </button>
            )}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            {[
              {
                key: "all",
                label: "الكل",
                count: notifications.length,
                icon: "📋",
              },
              {
                key: "unread",
                label: "غير مقروء",
                count: unreadCount,
                icon: "🔴",
              },
              {
                key: "read",
                label: "مقروء",
                count: notifications.length - unreadCount,
                icon: "✅",
              },
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  filter === filterOption.key
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "bg-white/60 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/80 shadow-md hover:shadow-lg"
                }`}
              >
                <span className="text-lg">{filterOption.icon}</span>
                {filterOption.label}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
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
        <div className="space-y-4">
          {filteredNotifications.map((notification, index) => (
            <div
              key={notification.id}
              className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-white/20 ${
                !notification.isRead ? "ring-2 ring-blue-500/50" : ""
              } w-full`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center text-2xl">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3
                        className={`font-bold text-lg ${
                          !notification.isRead
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(
                          notification.type
                        )}`}
                      >
                        {getTypeName(notification.type)}
                      </span>
                      {!notification.isRead && (
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-2">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      {notification.time}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      تم القراءة
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔔</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              لا توجد إشعارات
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {filter === "unread"
                ? "جميع إشعاراتك مقروءة"
                : filter === "read"
                ? "لا توجد إشعارات مقروءة"
                : "لا توجد إشعارات متاحة"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
