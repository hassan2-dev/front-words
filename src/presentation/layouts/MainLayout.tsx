import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../core/providers/AuthProvider";
import { useTheme } from "../../core/providers/ThemeProvider";
import { ROUTES, USER_ROLES } from "../../core/constants/app";
import {
  validateAuthentication,
  validateRouteAccess,
  getRedirectPath,
} from "../../core/utils/routeGuard";
import type { NavItem } from "../../core/types";
import {
  Home,
  BookOpen,
  User,
  Settings,
  LogOut,
  Bell,
  Crown,
  GraduationCap,
  Users,
  BarChart3,
  BookMarked,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  Trophy,
  Eye,
  Trash2,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
} from "../../core/utils/api";

// Get navigation items based on user role with strict authentication
const getNavItems = (
  role: string | undefined,
  unreadCount: number,
  isAuthenticated: boolean
): NavItem[] | any[] => {
  // If not authenticated, return empty array
  if (!isAuthenticated) {
    return [];
  }

  if (role === USER_ROLES.ADMIN) {
    return [
      {
        href: ROUTES.ADMIN_DASHBOARD,
        name: "لوحة التحكم",
        icon: <Crown size={20} />,
      },
      {
        href: ROUTES.ADMIN_USERS,
        name: "المستخدمين",
        icon: <Users size={20} />,
      },
      {
        href: ROUTES.ADMIN_CONTENT,
        name: "المحتوى",
        icon: <BookMarked size={20} />,
      },
      {
        href: ROUTES.ADMIN_ACHIEVEMENTS,
        name: "الإنجازات",
        icon: <Trophy size={20} />,
      },
    ];
  }

  if (role === USER_ROLES.TRAINER) {
    return [
      {
        href: ROUTES.TRAINER_DASHBOARD,
        name: "لوحة التحكم",
        icon: <GraduationCap size={20} />,
      },
      {
        href: ROUTES.TRAINER_STUDENTS,
        name: "الطلاب",
        icon: <Users size={20} />,
      },
      {
        href: ROUTES.TRAINER_CONTENT,
        name: "المحتوى",
        icon: <BookMarked size={20} />,
      },
    ];
  }

  return [
    { href: ROUTES.DASHBOARD, name: "الرئيسية", icon: <Home size={20} /> },
    {
      href: ROUTES.DAILY_WORDS,
      name: "الكلمات اليومية",
      icon: <BookOpen size={20} />,
    },
    {
      href: ROUTES.CHAT_WITH_AI,
      name: "المحادثة مع الذكاء الاصطناعي",
      icon: <Sparkles size={20} />,
    },
    { href: ROUTES.STORIES, name: "القصص", icon: <BookMarked size={20} /> },
    { href: "/achievements", name: "الإنجازات", icon: <Trophy size={20} /> },
  ];
};

// Get sidebar gradient based on user role
const getSidebarGradient = (role: string | undefined) => {
  if (role === USER_ROLES.ADMIN) {
    return "bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800";
  }
  if (role === USER_ROLES.TRAINER) {
    return "bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800";
  }
  return "bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700";
};

// Get role icon
const getRoleIcon = (role: string | undefined) => {
  if (role === USER_ROLES.ADMIN)
    return <Crown className="w-4 h-4 text-amber-300" />;
  if (role === USER_ROLES.TRAINER)
    return <GraduationCap className="w-4 h-4 text-emerald-300" />;
  return <Sparkles className="w-4 h-4 text-orange-300" />;
};

export const MainLayout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handelAllNotifications = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Navigating to notifications page...");
    setIsNotificationsOpen(false);
    setTimeout(() => {
      navigate("/notifications", { replace: true });
    }, 100);
  };
  // Function to get user data from localStorage with strict validation
  const getUserFromStorage = () => {
    try {
      const userData = localStorage.getItem("letspeak_user_data");
      const token = localStorage.getItem("letspeak_auth_token");

      if (!token || !userData) {
        return null;
      }

      const parsedData = JSON.parse(userData);
      const user = parsedData.user || parsedData;

      // Validate user data structure
      if (!user || !user.id || !user.role) {
        console.error("Invalid user data structure");
        return null;
      }

      return user;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  };

  // Get user data from localStorage as fallback
  const storedUser = getUserFromStorage();
  // Handle nested user structure (user.user) - handle both User and {user: User} types
  const actualUser = (user as any)?.user || user;
  const displayUser = actualUser || storedUser;

  // Strict authentication check using utility function
  const isUserAuthenticated = validateAuthentication(user, isAuthenticated);

  // Validate current route access using utility function
  useEffect(() => {
    if (isUserAuthenticated) {
      const hasAccess = validateRouteAccess(
        location.pathname,
        displayUser?.role,
        isUserAuthenticated
      );

      if (!hasAccess) {
        console.warn(`Unauthorized access attempt to: ${location.pathname}`);
        console.warn(`User role: ${displayUser?.role}`);
        console.warn(`Current path: ${location.pathname}`);
        toast.error("ليس لديك صلاحية للوصول إلى هذه الصفحة");

        // Redirect to appropriate dashboard using utility function
        const redirectPath = getRedirectPath(displayUser?.role);
        console.warn(`Redirecting to: ${redirectPath}`);
        navigate(redirectPath, { replace: true });
      }
    }
  }, [location.pathname, isUserAuthenticated, displayUser?.role, navigate]);

  // Refs for click outside detection
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);

  // State management
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(() => {
    const stored = localStorage.getItem("unreadNotificationsCount");
    return stored ? parseInt(stored, 10) : 0;
  });

  // Notifications dropdown state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!isUserAuthenticated) return;

    setNotificationsLoading(true);
    try {
      const res = await getNotifications();
      if (res.success && res.data) {
        const data = res.data as any;
        if (data.notifications && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          const unread = data.notifications.filter(
            (n: any) => !n.isRead
          ).length;
          setUnreadCount(unread);
          localStorage.setItem("unreadNotificationsCount", unread.toString());
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Mark notification as read
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
      const newUnreadCount = notifications.filter((n) => !n.isRead).length - 1;
      setUnreadCount(newUnreadCount);
      localStorage.setItem(
        "unreadNotificationsCount",
        newUnreadCount.toString()
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete notification
  const deleteNotificationHandler = async (id: number) => {
    setActionLoading(`delete-${id}`);
    try {
      await deleteNotification(id.toString());
      const notification = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));

      // Update unread count if deleted notification was unread
      if (notification && !notification.isRead) {
        const newUnreadCount = unreadCount - 1;
        setUnreadCount(newUnreadCount);
        localStorage.setItem(
          "unreadNotificationsCount",
          newUnreadCount.toString()
        );
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setActionLoading("mark-all");
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
      localStorage.setItem("unreadNotificationsCount", "0");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Update unreadCount from localStorage on mount and when window regains focus
  useEffect(() => {
    const updateUnread = () => {
      const stored = localStorage.getItem("unreadNotificationsCount");
      setUnreadCount(stored ? parseInt(stored, 10) : 0);
    };
    updateUnread();
    window.addEventListener("focus", updateUnread);
    return () => window.removeEventListener("focus", updateUnread);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isNotificationsOpen && isUserAuthenticated) {
      fetchNotifications();
    }
  }, [isNotificationsOpen, isUserAuthenticated]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }

      if (
        notificationsDropdownRef.current &&
        !notificationsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }

      // Close mobile sidebar when clicking outside
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        window.innerWidth < 1024 &&
        isSidebarOpen
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  // Prevent dropdown from closing when clicking inside
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Close dropdowns on route change
  useEffect(() => {
    setIsProfileOpen(false);
    setIsSidebarOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.clear();
      toast.success("تم تسجيل الخروج بنجاح");
      navigate(ROUTES.LOGIN);
    } catch {
      toast.error("حدث خطأ أثناء تسجيل الخروج");
    }
  };

  // Helper functions for notifications
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

  // If not authenticated, show loading or redirect
  if (!isUserAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            جاري التحقق من المصادقة...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300"
      dir="rtl"
    >
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
            aria-label="فتح القائمة"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Mobile Logo */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl p-2 shadow-lg">
                <img src="/logo.png" alt="logo" className="w-7 h-7" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse shadow-md"></div>
            </div>
            <div className="text-center">
              <h1 className="text-xl font-black text-gray-800 dark:text-white tracking-wider">
                Let<span className="text-orange-600">s</span>peak
              </h1>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
              aria-label="تبديل الوضع الليلي"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>

            {/* Mobile Notifications Dropdown */}
            <div className="relative" ref={notificationsDropdownRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
                aria-label="الإشعارات"
              >
                <Bell className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Mobile Notifications Dropdown */}
              {isNotificationsOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50"
                  onClick={handleDropdownClick}
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        الإشعارات
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          disabled={actionLoading === "mark-all"}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          {actionLoading === "mark-all"
                            ? "جاري..."
                            : "تمييز الكل كمقروء"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-2">
                    {notificationsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                      </div>
                    ) : notifications.length > 0 ? (
                      <div className="space-y-2">
                        {notifications.slice(0, 2).map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 rounded-xl transition-all duration-200 ${
                              !notification.isRead
                                ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
                                : "bg-gray-50 dark:bg-gray-700/50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">
                                {getTypeIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4
                                    className={`text-sm font-semibold truncate ${
                                      !notification.isRead
                                        ? "text-gray-900 dark:text-white"
                                        : "text-gray-600 dark:text-gray-400"
                                    }`}
                                  >
                                    {notification.title}
                                  </h4>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-bold ${getTypeColor(
                                      notification.type
                                    )}`}
                                  >
                                    {getTypeName(notification.type)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500 dark:text-gray-500">
                                    {formatDate(notification.createdAt)}
                                  </span>
                                  <div className="flex gap-1">
                                    {!notification.isRead && (
                                      <button
                                        onClick={() =>
                                          markAsRead(notification.id)
                                        }
                                        disabled={
                                          actionLoading ===
                                          `read-${notification.id}`
                                        }
                                        className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                      >
                                        <Eye className="w-3 h-3" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() =>
                                        deleteNotificationHandler(
                                          notification.id
                                        )
                                      }
                                      disabled={
                                        actionLoading ===
                                        `delete-${notification.id}`
                                      }
                                      className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {notifications.filter((n: any) => !n.isRead).length >=
                          2 && (
                          <div className="text-center pt-2">
                            <button
                              onClick={handelAllNotifications}
                              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium w-full py-3 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 active:scale-95 touch-manipulation"
                              style={{ touchAction: "manipulation" }}
                            >
                              عرض جميع الإشعارات (
                              {
                                notifications.filter((n: any) => !n.isRead)
                                  .length
                              }
                              )
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🔔</div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          لا توجد إشعارات جديدة
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Fixed on desktop, overlay on mobile */}
        <aside
          ref={sidebarRef}
          className={`
            ${getSidebarGradient(displayUser?.role)}
            fixed top-0 right-0 h-screen z-50
            lg:fixed lg:right-0 lg:top-0 lg:h-screen lg:z-40
            ${sidebarCollapsed ? "lg:w-20" : "lg:w-72"}
            fixed inset-y-0 right-0 w-80 z-50
            transform transition-all duration-300 ease-in-out
            ${isSidebarOpen ? "" : "hidden"} lg:block
            ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } lg:translate-x-0
            shadow-2xl border-l border-white/20 backdrop-blur-sm
            p-0 m-0
          `}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between mb-6">
                {/* Close button for mobile */}
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-2 rounded-xl hover:bg-white/20 text-white transition-all duration-200"
                  aria-label="إغلاق القائمة"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Collapse button for desktop */}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden lg:block p-2 rounded-xl hover:bg-white/20 text-white transition-all duration-200"
                  aria-label={
                    sidebarCollapsed ? "توسيع القائمة" : "تصغير القائمة"
                  }
                >
                  <ChevronDown
                    className={`w-5 h-5 transform transition-transform duration-300 ${
                      sidebarCollapsed ? "rotate-90" : "-rotate-90"
                    }`}
                  />
                </button>
              </div>

              {/* Logo */}
              <div
                className={`flex items-center gap-3 ${
                  sidebarCollapsed ? "lg:justify-center" : ""
                }`}
              >
                <div className="relative">
                  <div
                    className={`bg-white/20 rounded-xl shadow-xl backdrop-blur-sm ${
                      sidebarCollapsed ? "lg:p-2" : "p-3"
                    }`}
                  >
                    <img
                      src="/logo.png"
                      alt="logo"
                      className={`${
                        sidebarCollapsed ? "lg:w-15 lg:h-15" : "w-8 h-8"
                      }`}
                    />
                  </div>
                  <div
                    className={`absolute -top-1 -right-1 bg-amber-400 rounded-full animate-pulse shadow-md ${
                      sidebarCollapsed ? "lg:w-3 lg:h-3" : "w-4 h-4"
                    }`}
                  ></div>
                </div>
                {!sidebarCollapsed && (
                  <div className="lg:block">
                    <h1 className="text-xl font-black text-white tracking-wider drop-shadow-lg">
                      Let<span className="text-orange-300">s</span>peak
                    </h1>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {getNavItems(
                  displayUser?.role,
                  unreadCount,
                  isUserAuthenticated
                ).map((item: any, index: number) => {
                  const isActive = location.pathname === item.href;
                  const isExpanded = expandedItems.includes(item.href);

                  return (
                    <li key={index}>
                      <Link
                        to={item.href}
                        className={`
                          group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm relative overflow-hidden
                          ${sidebarCollapsed ? "lg:justify-center lg:px-2" : ""}
                          ${
                            isActive
                              ? "bg-white/95 text-orange-700 shadow-xl transform scale-105"
                              : "text-white/90 hover:bg-white/15 hover:text-white hover:scale-105"
                          }
                        `}
                        title={item.name}
                      >
                        <div
                          className={`relative z-10 transition-all duration-200 ${
                            isActive
                              ? "text-orange-600 scale-110"
                              : "text-white/90 group-hover:text-white group-hover:scale-110"
                          }`}
                        >
                          {item.icon}
                        </div>
                        {!sidebarCollapsed && (
                          <>
                            <span className="relative z-10 font-semibold">
                              {item.name || `Route ${index + 1}`}
                            </span>
                            {item.badge && (
                              <span className="mr-auto relative z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                                {item.badge > 99 ? "99+" : item.badge}
                              </span>
                            )}
                          </>
                        )}
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-white/95 rounded-xl"></div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* User Profile Section */}
            <div
              className="p-4 border-t border-white/20"
              ref={profileDropdownRef}
            >
              <div className="relative">
                <div
                  className={`flex items-center gap-3 bg-white/15 rounded-xl p-3 backdrop-blur-sm border border-white/20 shadow-xl ${
                    sidebarCollapsed ? "lg:justify-center" : ""
                  }`}
                >
                  <div className="relative">
                    <img
                      src={
                        displayUser?.avatar ||
                        `https://ui-avatars.com/api/?name=${
                          displayUser?.name || "مستخدم"
                        }&background=6366f1&color=fff&size=48`
                      }
                      alt={displayUser?.name || "مستخدم"}
                      className="w-10 h-10 rounded-full border-2 border-white shadow-lg"
                    />
                    <div className="absolute -bottom-1 -left-1">
                      {getRoleIcon(displayUser?.role)}
                    </div>
                  </div>
                  {!sidebarCollapsed && (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {displayUser?.name || "مستخدم"}
                        </p>
                        <p className="text-xs text-white/70 truncate font-medium">
                          {displayUser?.role === USER_ROLES.ADMIN
                            ? "مشرف النظام"
                            : displayUser?.role === USER_ROLES.TRAINER
                            ? "مدرب محترف"
                            : "طالب نشط"}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="p-2 rounded-lg hover:bg-white/20 text-white transition-all duration-200"
                        aria-label="القائمة الشخصية"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-300 ${
                            isProfileOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </>
                  )}
                </div>

                {/* Profile Dropdown */}
                {isProfileOpen && !sidebarCollapsed && (
                  <div className="absolute bottom-full mb-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl py-2 border border-gray-200 dark:border-gray-700 text-right animate-in slide-in-from-bottom-2 duration-200">
                    <Link
                      to={ROUTES.PROFILE}
                      className="flex items-center gap-3 py-3 px-4 rounded-lg mx-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-700 dark:text-gray-200 font-medium text-sm transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      الملف الشخصي
                    </Link>

                    <div className="h-px bg-gray-200 dark:bg-gray-700 mx-4 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-right py-3 px-4 rounded-lg mx-2 hover:bg-red-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 font-medium text-sm transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div
          className={`flex-1 min-h-screen transition-all duration-300 ${
            sidebarCollapsed ? "lg:mr-20" : "lg:mr-72"
          }`}
        >
          {/* Desktop Header */}
          <header className="hidden lg:flex sticky top-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 items-center justify-between px-8 py-5 shadow-lg">
            <div className="flex items-center gap-6">
              <button
                onClick={toggleTheme}
                className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
                aria-label="تبديل الوضع الليلي"
              >
                {isDarkMode ? (
                  <Sun className="w-6 h-6 text-amber-500 group-hover:rotate-12 transition-transform duration-200" />
                ) : (
                  <Moon className="w-6 h-6 text-slate-600 dark:text-gray-400 group-hover:rotate-12 transition-transform duration-200" />
                )}
              </button>
            </div>

            {/* Desktop Notifications Dropdown */}
            <div className="relative" ref={notificationsDropdownRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
                aria-label="الإشعارات"
              >
                <Bell className="w-6 h-6 text-slate-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-bounce">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Desktop Notifications Dropdown */}
              {isNotificationsOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-96 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50"
                  onClick={handleDropdownClick}
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        الإشعارات
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          disabled={actionLoading === "mark-all"}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          {actionLoading === "mark-all"
                            ? "جاري..."
                            : "تمييز الكل كمقروء"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-2">
                    {notificationsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                      </div>
                    ) : notifications.length > 0 ? (
                      <div className="space-y-2">
                        {notifications.slice(0, 5).map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 rounded-xl transition-all duration-200 ${
                              !notification.isRead
                                ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
                                : "bg-gray-50 dark:bg-gray-700/50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">
                                {getTypeIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4
                                    className={`text-sm font-semibold truncate ${
                                      !notification.isRead
                                        ? "text-gray-900 dark:text-white"
                                        : "text-gray-600 dark:text-gray-400"
                                    }`}
                                  >
                                    {notification.title}
                                  </h4>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-bold ${getTypeColor(
                                      notification.type
                                    )}`}
                                  >
                                    {getTypeName(notification.type)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500 dark:text-gray-500">
                                    {formatDate(notification.createdAt)}
                                  </span>
                                  <div className="flex gap-1">
                                    {!notification.isRead && (
                                      <button
                                        onClick={() =>
                                          markAsRead(notification.id)
                                        }
                                        disabled={
                                          actionLoading ===
                                          `read-${notification.id}`
                                        }
                                        className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                      >
                                        <Eye className="w-3 h-3" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() =>
                                        deleteNotificationHandler(
                                          notification.id
                                        )
                                      }
                                      disabled={
                                        actionLoading ===
                                        `delete-${notification.id}`
                                      }
                                      className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {notifications.length > 5 && (
                          <div className="text-center pt-2">
                            <button
                              onClick={handelAllNotifications}
                              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium w-full py-3 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 active:scale-95"
                            >
                              عرض جميع الإشعارات ({notifications.length})
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🔔</div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          لا توجد إشعارات جديدة
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Main Page Content */}
          <main className="md:p-4 p-2 min-h-[calc(100vh-4rem)]">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
