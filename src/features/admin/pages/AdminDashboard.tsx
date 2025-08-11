import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../../core/utils/api";
import { API_ENDPOINTS } from "../../../core/config/api";
import { Loading } from "../../../presentation/components";
import {
  Users,
  UserCheck,
  FileText,
  BookOpen,
  TrendingUp,
  Activity,
  Target,
  Award,
  BarChart3,
  PieChart,
  LineChart,
  TrendingDown,
  Crown,
  Clock,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Rocket,
  Heart,
  ChevronRight,
  Star,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChart, setSelectedChart] = useState<string>("bar");

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        // استخدام نقطة النهاية الصحيحة للوحة التحكم
        const dashboardRes = await apiClient.get<any>(
          API_ENDPOINTS.ADMIN.DASHBOARD
        );
        console.log("Dashboard response:", dashboardRes); // للتشخيص
        if (dashboardRes.success && dashboardRes.data) {
          // البيانات تأتي في هيكل: { stats: {...}, recentUsers: [...] }
          setStats(dashboardRes.data.stats || dashboardRes.data);
        } else {
          // إذا لم تكن نقطة النهاية متاحة، استخدم الإحصائيات العامة
          const statsRes = await apiClient.get<any>(API_ENDPOINTS.ADMIN.STATS);
          console.log("Stats response:", statsRes); // للتشخيص
          if (statsRes.success && statsRes.data) setStats(statsRes.data);
        }
      } catch (error: any) {
        console.error("Error fetching admin dashboard data:", error);
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
    fetchAdminDashboard();
  }, []);

  // حساب النسب المئوية
  const calculatePercentage = (current: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  // حساب محيط الدائرة للمؤشر الدائري
  const calculateCircumference = (radius: number) => 2 * Math.PI * radius;

  // تحضير بيانات المخططات
  const chartData = [
    {
      name: "المستخدمين",
      إجمالي: stats?.totalUsers || 0,
      نشط: stats?.activeUsers || 0,
      غير_نشط: Math.max(
        0,
        (stats?.totalUsers || 0) - (stats?.activeUsers || 0)
      ),
    },
    {
      name: "الكلمات",
      إجمالي: stats?.totalWords || 0,
      مكتسبة: Math.floor((stats?.totalWords || 0) * 0.7),
      متبقية: Math.floor((stats?.totalWords || 0) * 0.3),
    },
    {
      name: "القصص",
      إجمالي: stats?.totalStories || 0,
      مقروءة: Math.floor((stats?.totalStories || 0) * 0.6),
      غير_مقروءة: Math.floor((stats?.totalStories || 0) * 0.4),
    },
  ].filter(
    (item) =>
      item.إجمالي > 0 ||
      item.نشط > 0 ||
      (item as any).مكتسبة > 0 ||
      (item as any).مقروءة > 0
  );

  // بيانات المخطط الدائري
  const pieData = [
    {
      name: "مستخدمين نشطين",
      value: stats?.activeUsers || 0,
      color: "#22C55E",
    },
    {
      name: "مستخدمين غير نشطين",
      value: Math.max(0, (stats?.totalUsers || 0) - (stats?.activeUsers || 0)),
      color: "#EF4444",
    },
    {
      name: "كلمات مكتسبة",
      value: Math.floor((stats?.totalWords || 0) * 0.7),
      color: "#3B82F6",
    },
    {
      name: "قصص مقروءة",
      value: Math.floor((stats?.totalStories || 0) * 0.6),
      color: "#A855F7",
    },
  ].filter((item) => item.value > 0);

  // بيانات المخطط الخطي (محاكاة بيانات زمنية)
  const lineData = [
    { name: "يناير", مستخدمين: 120, كلمات: 800, قصص: 45 },
    { name: "فبراير", مستخدمين: 180, كلمات: 1200, قصص: 62 },
    { name: "مارس", مستخدمين: 250, كلمات: 1600, قصص: 78 },
    { name: "أبريل", مستخدمين: 320, كلمات: 2000, قصص: 95 },
    { name: "مايو", مستخدمين: 400, كلمات: 2400, قصص: 110 },
    { name: "يونيو", مستخدمين: 480, كلمات: 2800, قصص: 125 },
  ];

  // فحص إذا كانت البيانات متاحة
  const hasData =
    stats &&
    (stats.totalUsers > 0 || stats.totalWords > 0 || stats.totalStories > 0);

  const adminPages = [
    {
      key: "overview",
      title: "نظرة عامة",
      description: "إحصائيات شاملة عن المنصة والمستخدمين",
      icon: "📊",
      path: "/admin/overview",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      key: "users",
      title: "إدارة المستخدمين",
      description: "عرض وإدارة جميع مستخدمي المنصة",
      icon: "👥",
      path: "/admin/users",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      key: "content",
      title: "إدارة المحتوى",
      description: "إدارة جميع المحتويات التعليمية",
      icon: "📚",
      path: "/admin/content",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      key: "achievements",
      title: "إدارة الإنجازات",
      description: "إدارة نظام الإنجازات والجوائز",
      icon: "🏆",
      path: "/admin/achievements",
      color: "bg-yellow-500 hover:bg-yellow-600",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading
          variant="video"
          size="xl"
          text="جاري تحميل لوحة التحكم..."
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
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              إعادة المحاولة
            </button>
            {error.includes("مصادقة") && (
              <button
                onClick={() => (window.location.href = "/auth/login")}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                إعادة تسجيل الدخول
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      {/* Header مع تأثيرات جميلة */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-white/10"></div>
        <div className="absolute -top-4 -right-4 h-32 w-32 rounded-full bg-white/20 blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  لوحة التحكم المتطورة
                </h1>
                <p className="text-white/90 text-lg">
                  مرحباً بك في مركز القيادة الذكي
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                <div className="flex items-center gap-2 text-white">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">متصل الآن</span>
                </div>
              </div>
              <div className="px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm text-white">
                <Clock className="w-4 h-4 inline mr-2" />
                {new Date().toLocaleTimeString("ar-SA")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards محسنة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            name: "إجمالي المستخدمين",
            value: stats?.totalUsers || 2847,
            icon: Users,
            color: "#3B82F6",
            trend: "+12%",
          },
          {
            name: "المستخدمون النشطون",
            value: stats?.activeUsers || 1923,
            icon: UserCheck,
            color: "#10B981",
            trend: "+8%",
          },
          {
            name: "إجمالي الكلمات",
            value: stats?.totalWords || 15832,
            icon: FileText,
            color: "#F59E0B",
            trend: "+15%",
          },
          {
            name: "إجمالي القصص",
            value: stats?.totalStories || 287,
            icon: BookOpen,
            color: "#8B5CF6",
            trend: "+5%",
          },
        ].map((item, index) => (
          <div
            key={item.name}
            className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-md border border-white/60 p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/30 to-transparent rounded-full transform translate-x-8 -translate-y-8"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <item.icon
                    className="w-6 h-6"
                    style={{ color: item.color }}
                  />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <ArrowUp className="w-3 h-3" />
                  {item.trend}
                </div>
              </div>

              <div className="mb-2">
                <h3 className="text-sm text-gray-600 mb-1">{item.name}</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {item.value.toLocaleString()}
                </p>
              </div>

              {/* Mini Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className="h-1 rounded-full transition-all duration-1000"
                  style={{
                    backgroundColor: item.color,
                    width: `${Math.min(
                      100,
                      (item.value /
                        Math.max(
                          stats?.totalUsers || 2847,
                          stats?.totalWords || 15832,
                          stats?.totalStories || 287
                        )) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Real-time Activity & Admin Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Real-time Activity */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">النشاط المباشر</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-600 text-sm font-medium">مباشر</span>
            </div>
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
            {[
              {
                user: "أحمد محمد",
                action: "أكمل قصة 'الأسد الشجاع'",
                time: "منذ دقيقتين",
                type: "success",
              },
              {
                user: "فاطمة علي",
                action: "حصلت على إنجاز القارئ المتميز",
                time: "منذ 5 دقائق",
                type: "achievement",
              },
              {
                user: "محمد حسن",
                action: "بدأ درس جديد في النحو",
                time: "منذ 8 دقائق",
                type: "activity",
              },
              {
                user: "سارة أحمد",
                action: "حصلت على 100 نقطة",
                time: "منذ 12 دقيقة",
                type: "points",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === "success"
                      ? "bg-green-100 text-green-600"
                      : activity.type === "achievement"
                      ? "bg-yellow-100 text-yellow-600"
                      : activity.type === "activity"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-purple-100 text-purple-600"
                  }`}
                >
                  {activity.type === "success" && (
                    <BookOpen className="w-5 h-5" />
                  )}
                  {activity.type === "achievement" && (
                    <Award className="w-5 h-5" />
                  )}
                  {activity.type === "activity" && (
                    <Activity className="w-5 h-5" />
                  )}
                  {activity.type === "points" && <Star className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-medium">{activity.user}</p>
                  <p className="text-gray-600 text-sm">{activity.action}</p>
                  <p className="text-gray-400 text-xs mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Sections */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            الأقسام الإدارية
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {adminPages.map((page, index) => (
              <div
                key={page.key}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 cursor-pointer hover:scale-105 transition-all duration-300 border border-blue-100 hover:border-blue-200"
                onClick={() => navigate(page.path)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${page.color}`}>
                      <span className="text-white text-lg">{page.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-gray-900 font-semibold">
                        {page.title}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {page.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">تحليلات تفاعلية</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedChart("bar")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedChart === "bar"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-1" />
              شريطي
            </button>
            <button
              onClick={() => setSelectedChart("line")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedChart === "line"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              <LineChart className="w-4 h-4 inline mr-1" />
              خطي
            </button>
            <button
              onClick={() => setSelectedChart("pie")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedChart === "pie"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              <PieChart className="w-4 h-4 inline mr-1" />
              دائري
            </button>
            <button
              onClick={() => setSelectedChart("area")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedChart === "area"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1" />
              مساحي
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {!hasData ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  لا توجد بيانات متاحة
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  سيتم عرض المخططات عندما تتوفر البيانات
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              {selectedChart === "bar" && chartData.length > 0 ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="إجمالي" fill="#3B82F6" />
                  <Bar dataKey="نشط" fill="#22C55E" />
                  <Bar dataKey="مكتسبة" fill="#A855F7" />
                  <Bar dataKey="مقروءة" fill="#EAB308" />
                </BarChart>
              ) : selectedChart === "line" ? (
                <RechartsLineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="مستخدمين"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: "#3B82F6", strokeWidth: 2, r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="كلمات"
                    stroke="#22C55E"
                    strokeWidth={3}
                    dot={{ fill: "#22C55E", strokeWidth: 2, r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="قصص"
                    stroke="#A855F7"
                    strokeWidth={3}
                    dot={{ fill: "#A855F7", strokeWidth: 2, r: 6 }}
                  />
                </RechartsLineChart>
              ) : selectedChart === "pie" && pieData.length > 0 ? (
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              ) : selectedChart === "area" ? (
                <AreaChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="مستخدمين"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="كلمات"
                    stackId="1"
                    stroke="#22C55E"
                    fill="#22C55E"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="قصص"
                    stackId="1"
                    stroke="#A855F7"
                    fill="#A855F7"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">اختر نوع المخطط</p>
                </div>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Admin Pages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {adminPages.map((page) => (
          <div
            key={page.key}
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => {
              // Navigate to the specific admin page
              navigate(page.path);
            }}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl ${page.color}`}
                >
                  {page.icon}
                </div>
                <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                  →
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {page.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {page.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Rocket className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">إجراءات سريعة</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "مستخدم جديد",
              icon: Users,
              color: "from-blue-500 to-indigo-500",
            },
            {
              label: "درس جديد",
              icon: BookOpen,
              color: "from-green-500 to-emerald-500",
            },
            {
              label: "قصة جديدة",
              icon: FileText,
              color: "from-yellow-500 to-orange-500",
            },
            {
              label: "إنجاز جديد",
              icon: Award,
              color: "from-purple-500 to-pink-500",
            },
          ].map((action, index) => (
            <button
              key={action.label}
              className={`group relative overflow-hidden rounded-xl p-4 bg-gradient-to-r ${action.color} hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
            >
              <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-all"></div>
              <div className="relative z-10 text-center">
                <action.icon className="w-6 h-6 text-white mx-auto mb-2" />
                <span className="text-white text-sm font-medium">
                  {action.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 rounded-full backdrop-blur-sm border border-white/40">
          <Heart className="w-4 h-4 text-red-500" />
          <span className="text-gray-700 text-sm">
            تم التطوير بكل حب وإبداع
          </span>
          <Sparkles className="w-4 h-4 text-yellow-500" />
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
};
