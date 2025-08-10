import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../core/providers/AuthProvider";
import { useTheme } from "../../core/providers/ThemeProvider";
import { ROUTES, USER_ROLES } from "../../core/constants/app";
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
} from "lucide-react";
import toast from "react-hot-toast";

// Get navigation items based on user role
const getNavItems = (
  role: string | undefined,
  unreadCount: number
): NavItem[] => {
  if (role === USER_ROLES.ADMIN) {
    return [
      {
        name: "لوحة التحكم",
        href: ROUTES.ADMIN_DASHBOARD,
        icon: <Crown size={20} />,
      },
      {
        name: "المستخدمون",
        href: ROUTES.ADMIN_USERS,
        icon: <Users size={20} />,
      },
      {
        name: "الإحصائيات",
        href: ROUTES.ADMIN_ANALYTICS,
        icon: <BarChart3 size={20} />,
      },
    ];
  }

  if (role === USER_ROLES.TRAINER) {
    return [
      {
        name: "لوحة المدرب",
        href: ROUTES.TRAINER_DASHBOARD,
        icon: <GraduationCap size={20} />,
      },
      {
        name: "الطلاب",
        href: ROUTES.TRAINER_STUDENTS,
        icon: <Users size={20} />,
      },
      {
        name: "المحتوى",
        href: ROUTES.TRAINER_CONTENT,
        icon: <BookMarked size={20} />,
      },
    ];
  }

  return [
    { name: "الرئيسية", href: ROUTES.DASHBOARD, icon: <Home size={20} /> },
    {
      name: "كلمات اليوم",
      href: ROUTES.DAILY_WORDS,
      icon: <BookOpen size={20} />,
    },
    {
      name: "الجات مع AI",
      href: ROUTES.CHAT_WITH_AI,
      icon: <Sparkles size={20} />,
    },
    { name: "القصص", href: ROUTES.STORIES, icon: <BookMarked size={20} /> },
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
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Function to get user data from localStorage
  const getUserFromStorage = () => {
    try {
      const userData = localStorage.getItem("letspeak_user_data");
      if (userData) {
        const parsedData = JSON.parse(userData);
        console.log("Parsed data from localStorage:", parsedData);
        // Handle both formats: direct user object or {user: {...}}
        const user = parsedData.user || parsedData;
        console.log("Extracted user:", user);
        return user;
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
    return null;
  };

  // Get user data from localStorage as fallback
  const storedUser = getUserFromStorage();
  const displayUser = user || storedUser;

  // Debug: Check localStorage and user data
  useEffect(() => {
    console.log("=== DEBUG USER DATA ===");
    console.log("User from useAuth:", user);
    console.log("Stored user from localStorage:", storedUser);
    console.log("Display user:", displayUser);
    console.log(
      "User data from localStorage:",
      localStorage.getItem("letspeak_user_data")
    );
    console.log(
      "Auth token from localStorage:",
      localStorage.getItem("letspeak_auth_token")
    );
    console.log("Is user authenticated:", user !== null);
    console.log("User name:", displayUser?.name);
    console.log("========================");
  }, [user, storedUser, displayUser]);

  // Refs for click outside detection
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // State management
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => {
    const stored = localStorage.getItem("unreadNotificationsCount");
    return stored ? parseInt(stored, 10) : 0;
  });

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
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

  // Close dropdowns on route change
  useEffect(() => {
    setIsProfileOpen(false);
    setIsSidebarOpen(false);
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
      toast.success("تم تسجيل الخروج بنجاح");
      navigate(ROUTES.LOGIN);
    } catch {
      toast.error("حدث خطأ أثناء تسجيل الخروج");
    }
  };

  const navItems = getNavItems(user?.role, unreadCount);

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
            <button
              onClick={() => navigate(ROUTES.NOTIFICATIONS)}
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
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Fixed on desktop, overlay on mobile */}
        <aside
          ref={sidebarRef}
          className={`
            ${getSidebarGradient(user?.role)}
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
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.name}>
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
                              {item.name}
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

                {/* Achievements Link */}
                <li>
                  <Link
                    to="/achievements"
                    className={`
                      group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm text-white/90 hover:bg-white/15 hover:text-white hover:scale-105
                      ${sidebarCollapsed ? "lg:justify-center lg:px-2" : ""}
                    `}
                    title="إنجازاتي"
                  >
                    <Trophy className="w-5 h-5" />
                    {!sidebarCollapsed && <span>إنجازاتي</span>}
                  </Link>
                </li>
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
                        user?.avatar ||
                        `https://ui-avatars.com/api/?name=${
                          displayUser?.name || storedUser?.name || "مستخدم"
                        }&background=6366f1&color=fff&size=48`
                      }
                      alt={displayUser?.name || storedUser?.name || "مستخدم"}
                      className="w-10 h-10 rounded-full border-2 border-white shadow-lg"
                    />
                    <div className="absolute -bottom-1 -left-1">
                      {getRoleIcon(displayUser?.role || storedUser?.role)}
                    </div>
                  </div>
                  {!sidebarCollapsed && (
                    <>
                      {console.log("User data:", displayUser)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {displayUser?.name || storedUser?.name || "مستخدم"}
                        </p>
                        <p className="text-xs text-white/70 truncate font-medium">
                          {(displayUser?.role || storedUser?.role) ===
                          USER_ROLES.ADMIN
                            ? "مشرف النظام"
                            : (displayUser?.role || storedUser?.role) ===
                              USER_ROLES.TRAINER
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

            {/* Desktop Notifications */}
            <button
              onClick={() => navigate(ROUTES.NOTIFICATIONS)}
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
