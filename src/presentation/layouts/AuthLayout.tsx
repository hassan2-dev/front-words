import React from "react";
import { Outlet } from "react-router-dom";
import { useTheme } from "../../core/providers/ThemeProvider";
import { Sparkles, BookOpen, Users, Star, Sun, Moon } from "lucide-react";

export const AuthLayout: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div
      className="min-h-screen flex bg-[#E6E5E1] dark:bg-[#003F3E] transition-all duration-700 relative overflow-hidden"
      dir="rtl"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#003F3E]/10 dark:bg-[#FF914D]/10 rounded-full blur-3xl animate-spin-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#FF914D]/10 dark:bg-[#003F3E]/10 rounded-full blur-3xl animate-spin-slow-reverse"></div>
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        <div className="flex flex-col justify-center items-center w-full p-12 relative z-10">
          {/* Logo Section */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="relative inline-block transform hover:scale-110 transition-all duration-500">
              <div className="bg-gradient-to-r from-[#003F3E] to-[#FF914D] rounded-3xl p-8 shadow-2xl mb-8 animate-pulse">
                <img src="/logo.png" alt="logo" className="w-20 h-20" />
              </div>
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#FF914D]/70 rounded-full animate-bounce shadow-lg"></div>
              <div className="absolute -bottom-3 -left-3 w-8 h-8 bg-[#003F3E]/70 rounded-full animate-pulse shadow-lg"></div>
            </div>
            <h1 className="text-6xl font-black bg-gradient-to-r from-[#003F3E] to-[#FF914D] bg-clip-text text-transparent mb-6 font-english animate-fade-in">
              Let <span className="text-[#FF914D]">s</span>peak
            </h1>
            <p className="text-2xl text-[#003F3E] dark:text-[#E6E5E1] font-medium font-arabic">
              منصة تعلم اللغة الإنجليزية التفاعلية
            </p>
          </div>

          {/* Features */}
          <div className="space-y-8 max-w-lg">
            <div className="flex items-center gap-6 bg-white/90 dark:bg-[#003F3E]/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl hover:shadow-[#003F3E]/30 dark:hover:shadow-[#FF914D]/20 transition-all duration-500 hover:-translate-y-2 border border-[#003F3E]/20 dark:border-[#FF914D]/30">
              <div className="bg-[#003F3E] rounded-2xl p-4 flex-shrink-0 shadow-lg">
                <BookOpen className="w-8 h-8 text-[#FF914D]" />
              </div>
              <div>
                <h3 className="font-bold text-[#003F3E] dark:text-[#E6E5E1] mb-2 text-xl font-arabic">
                  تعلم تفاعلي
                </h3>
                <p className="text-[#003F3E]/70 dark:text-[#E6E5E1]/80 text-base font-arabic">
                  كلمات وقصص يومية مخصصة لمستواك
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 bg-white/90 dark:bg-[#003F3E]/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl hover:shadow-[#FF914D]/30 dark:hover:shadow-[#003F3E]/20 transition-all duration-500 hover:-translate-y-2 border border-[#FF914D]/20 dark:border-[#003F3E]/30">
              <div className="bg-[#FF914D] rounded-2xl p-4 flex-shrink-0 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[#003F3E] dark:text-[#E6E5E1] mb-2 text-xl font-arabic">
                  مجتمع متفاعل
                </h3>
                <p className="text-[#003F3E]/70 dark:text-[#E6E5E1]/80 text-base font-arabic">
                  تعلم مع آلاف المتعلمين العرب
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 bg-white/90 dark:bg-[#003F3E]/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl hover:shadow-[#003F3E]/30 dark:hover:shadow-[#FF914D]/20 transition-all duration-500 hover:-translate-y-2 border border-[#003F3E]/20 dark:border-[#FF914D]/30">
              <div className="bg-[#003F3E] rounded-2xl p-4 flex-shrink-0 shadow-lg">
                <Star className="w-8 h-8 text-[#FF914D]" />
              </div>
              <div>
                <h3 className="font-bold text-[#003F3E] dark:text-[#E6E5E1] mb-2 text-xl font-arabic">
                  تتبع التقدم
                </h3>
                <p className="text-[#003F3E]/70 dark:text-[#E6E5E1]/80 text-base font-arabic">
                  احتفظ بسجل إنجازاتك ومستواك
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Floating Elements */}
        <div className="absolute top-20 right-20 text-[#003F3E]/40 dark:text-[#FF914D]/30 animate-float">
          <Sparkles className="w-10 h-10" />
        </div>
        <div className="absolute bottom-32 left-32 text-[#FF914D]/40 dark:text-[#003F3E]/30 animate-float delay-500">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="absolute top-1/2 left-20 text-[#003F3E]/40 dark:text-[#FF914D]/30 animate-float delay-1000">
          <Sparkles className="w-12 h-12" />
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center items-center lg:w-[60vw] xl:w-[700px] 2xl:w-[800px] mx-auto transition-all duration-500 relative z-10">
        {/* Theme Toggle */}
        <div className="flex justify-start p-6 w-full">
          <button
            onClick={toggleTheme}
            className="p-4 rounded-2xl bg-white/90 dark:bg-[#003F3E]/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-110 border border-[#003F3E]/20 dark:border-[#FF914D]/30"
            aria-label="تبديل الوضع الليلي"
          >
            {isDarkMode ? (
              <Sun className="w-7 h-7 text-[#FF914D]" />
            ) : (
              <Moon className="w-7 h-7 text-[#003F3E]" />
            )}
          </button>
        </div>

        <Outlet />

        {/* Footer */}
        <div className="p-6 text-center w-full">
          <p className="text-[#003F3E] dark:text-[#E6E5E1] text-sm font-english">
            © {new Date().getFullYear()} Let{" "}
            <span className="text-[#FF914D]">s</span>peak. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </div>
  );
};
