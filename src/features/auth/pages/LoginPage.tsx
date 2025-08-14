import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../core/providers/AuthProvider";
import { ROUTES } from "../../../core/constants/app";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useTheme } from "../../../core/providers/ThemeProvider";
import { Loading } from "../../../presentation/components";

const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, isAuthenticated, user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // Helper to get route by role
  const getRouteByRole = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return ROUTES.ADMIN_DASHBOARD;
      case "TRAINER":
        return ROUTES.TRAINER_DASHBOARD;
      case "USER":
      default:
        return ROUTES.DASHBOARD;
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getRouteByRole(user.role));
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login({ phone, password });
      if (!success) {
        setError("رقم الهاتف أو كلمة المرور غير صحيحة");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setError("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center transition-colors duration-300">
      {/* Loading Overlay */}
      {isLoading && (
        <Loading
          isOverlay
          variant="video"
          size="xl"
          text="جاري تسجيل الدخول..."
        />
      )}

      <div className="w-full max-w-2xl px-10 py-16 flex flex-col items-center justify-center transition-all duration-300">
        <div className="text-center mb-8 w-full flex flex-col items-center justify-center">
          <img
            src="/logo.png"
            alt="logo"
            className="w-20 h-20 mb-4 sm:flex lg:hidden md:flex"
          />
          <h2
            className={`text-3xl sm:text-5xl font-extrabold mb-3 tracking-tight ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            تسجيل الدخول
          </h2>
          <p
            className={`text-lg ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            أدخل بياناتك للوصول إلى حسابك
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-xl text-base text-center font-medium shadow">
            {error}
          </div>
        )}

        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label
                htmlFor="phone"
                className={`block text-lg font-semibold mb-2 ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                رقم الهاتف
              </label>
              <input
                id="phone"
                name="phone"
                // type="tel"
                type="number"
                inputMode="numeric"
                maxLength={11}
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full px-6 py-5 rounded-2xl border-2 text-xl font-medium focus:outline-none focus:ring-4 transition duration-200 ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700 text-white focus:ring-blue-700 focus:border-blue-500 placeholder-gray-500"
                    : "bg-white border-gray-300 text-gray-900 focus:ring-blue-200 focus:border-blue-500 placeholder-gray-400"
                }`}
                placeholder="0780123456"
                dir="rtl"
              />
            </div>

            <div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-6 py-5 pr-14 rounded-2xl border-2 text-xl font-medium focus:outline-none focus:ring-4 transition duration-200 ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700 text-white focus:ring-purple-700 focus:border-purple-500 placeholder-gray-500"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-purple-200 focus:border-purple-500 placeholder-gray-400"
                  }`}
                  placeholder="••••••••"
                  dir="rtl"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                  aria-label={
                    showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-6 h-6" />
                  ) : (
                    <Eye className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-5 px-6 rounded-2xl text-2xl font-bold shadow-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed
                ${
                  isDarkMode
                    ? "bg-white text-black hover:bg-gray-200"
                    : "bg-black text-white hover:bg-gray-900"
                }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-7 h-7 mr-3 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                "تسجيل الدخول"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
