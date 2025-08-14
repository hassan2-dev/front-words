/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useEffect, useState } from "react";
import {
  getMyAchievements,
  getMyAchievementProgress,
  getMyRecentAchievements,
  getLeaderboard,
} from "../../core/utils/api";
import { useAuth } from "../../core/providers/AuthProvider";
import type {
  UserAchievement,
  AchievementProgress,
  LeaderboardEntry,
} from "../../core/types";
import { Loading } from "@/presentation/components";

export const AchievementsPage: React.FC = () => {
  useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "achievements" | "progress" | "recent" | "leaderboard"
  >("achievements");
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress | null>(null);
  const [recentAchievements, setRecentAchievements] = useState<
    UserAchievement[]
  >([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch achievements
        const achievementsRes = await getMyAchievements();
        if (achievementsRes.success) {
          // Handle both nested and direct response structures
          const achievementsData = achievementsRes.data || achievementsRes;
          setAchievements(achievementsData.achievements || []);
          setTotalPoints(
            (achievementsData as any).points ||
              achievementsData.totalPoints ||
              0
          );
        }

        // Fetch progress
        const progressRes = await getMyAchievementProgress();
        if (progressRes.success) {
          const progressData = progressRes.data || progressRes;
          // Map the actual API response to our expected structure
          setProgress({
            totalAchievements: (progressData as any).achievementsCount || 0,
            completedAchievements: (progressData as any).achievementsCount || 0,
            totalPoints: progressData.totalPoints || 0,
            currentStreak: (progressData as any).streak || 0,
            level: (progressData as any).level || "L1",
            nextLevelPoints: 0, // Calculate this if needed
          });
        }

        // Fetch recent achievements
        const recentRes = await getMyRecentAchievements({ limit: 5 });
        if (recentRes.success) {
          const recentData = recentRes.data || recentRes;
          setRecentAchievements(Array.isArray(recentData) ? recentData : []);
        }

        // Fetch leaderboard
        const leaderboardRes = await getLeaderboard({ limit: 10 });
        if (leaderboardRes.success) {
          const leaderboardData = leaderboardRes.data || leaderboardRes;
          setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
        }
      } catch (error) {
        console.error("Error fetching achievements data:", error);
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Loading
          size="xl"
          variant="video"
          text="جاري تحميل الإنجازات..."
          isOverlay
        />
      </div>
    );
  }

  const renderAchievements = () => (
    <>
      {achievements.length === 0 ? (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center border border-white/30 dark:border-gray-700/30">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-3xl text-white">✨</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            لا توجد إنجازات بعد
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            ابدأ الأنشطة اليومية لتحقق أول إنجاز لك!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {achievements.map((achievement) => {
            // Handle both UserAchievement and direct Achievement objects
            const achievementData =
              (achievement as any).achievement || achievement;
            const isAchieved = achievementData.achieved || false;
            const achievedAt = (achievement as any).achievedAt;
            const progress = (achievement as any).progress || 0;

            return (
              <div
                key={achievement.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                  isAchieved
                    ? "border-2 border-green-500"
                    : "border border-gray-200 dark:border-gray-700 opacity-90"
                }`}
              >
                <div className="p-4 sm:p-6">
                  {/* Icon and Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl ${
                        isAchieved
                          ? "bg-gradient-to-r from-green-500 to-emerald-600"
                          : "bg-gradient-to-r from-gray-400 to-gray-500"
                      }`}
                    >
                      {achievementData.icon || (isAchieved ? "🏆" : "🔒")}
                    </div>
                    <div
                      className={`text-sm font-semibold px-2 py-1 rounded-full ${
                        isAchieved
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {isAchieved ? "مكتمل" : "قيد التقدم"}
                    </div>
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {achievementData.name || "إنجاز بدون عنوان"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {achievementData.description || "لا يوجد وصف"}
                  </p>

                  {/* Points */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      نقاط الإنجاز
                    </span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {achievementData.points || 0}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {progress > 0 && progress < 100 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>التقدم</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Achievement Date */}
                  {isAchieved && achievedAt && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      تم تحقيقه: {new Date(achievedAt).toLocaleDateString()}
                    </div>
                  )}

                  {/* Hover Effect */}
                  <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors mt-2">
                    {isAchieved ? "✓ تم الإنجاز" : "→ استمر في التقدم"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  const renderProgress = () => (
    <div className="space-y-6">
      {progress && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {progress.totalPoints}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                إجمالي النقاط
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {progress.completedAchievements}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                الإنجازات المكتملة
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {progress.currentStreak}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                أيام الاستمرارية
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {progress.level}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                المستوى الحالي
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-4">التقدم العام</h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>الإنجازات المكتملة</span>
                <span>
                  {progress.completedAchievements} /{" "}
                  {progress.totalAchievements}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full"
                  style={{
                    width: `${
                      (progress.completedAchievements /
                        progress.totalAchievements) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {progress.nextLevelPoints > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                تحتاج {progress.nextLevelPoints - progress.totalPoints} نقطة
                للوصول للمستوى التالي
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderRecent = () => (
    <div className="space-y-4">
      {recentAchievements.length > 0 ? (
        recentAchievements.map((achievement) => {
          // Handle both UserAchievement and direct Achievement objects
          const achievementData =
            (achievement as any).achievement || achievement;
          const achievedAt = (achievement as any).achievedAt;

          return (
            <div
              key={achievement.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg flex items-center gap-4 border-l-4 border-green-500"
            >
              <div className="flex-shrink-0 text-2xl">
                {achievementData.icon || "🏆"}
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">
                  {achievementData.name || "إنجاز بدون عنوان"}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  {achievementData.description || "لا يوجد وصف"}
                </div>
                {achievedAt && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    تم تحقيقه: {new Date(achievedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                +{achievementData.points || 0}
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-8 text-gray-500">
          لا توجد إنجازات حديثة
        </div>
      )}
    </div>
  );

  const renderLeaderboard = () => (
    <div className="space-y-4">
      {leaderboard.map((entry, index) => (
        <div
          key={entry.userId}
          className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg flex items-center gap-4 ${
            index === 0 ? "border-2 border-yellow-400" : ""
          }`}
        >
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              index === 0
                ? "bg-yellow-400 text-white"
                : index === 1
                ? "bg-gray-300 text-gray-700"
                : index === 2
                ? "bg-orange-400 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {index + 1}
          </div>
          <div className="flex-1">
            <div className="font-bold">{entry.userName}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {entry.achievements} إنجاز
            </div>
          </div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {entry.totalPoints} نقطة
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 border border-white/30 dark:border-gray-700/30">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  إنجازاتي
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                  مجموع نقاطك:{" "}
                  <span className="font-extrabold text-green-600 dark:text-green-400">
                    {totalPoints}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl p-5 text-center shadow-xl border border-white/30 dark:border-gray-700/30">
            <div className="text-2xl font-extrabold text-green-600 dark:text-green-400 mb-1">
              {totalPoints}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              إجمالي النقاط
            </div>
          </div>
          <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl p-5 text-center shadow-xl border border-white/30 dark:border-gray-700/30">
            <div className="text-2xl font-extrabold text-yellow-600 dark:text-yellow-400 mb-1">
              {progress?.completedAchievements ?? achievements.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              الإنجازات المكتملة
            </div>
          </div>
          <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl p-5 text-center shadow-xl border border-white/30 dark:border-gray-700/30">
            <div className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 mb-1">
              {progress?.currentStreak ?? 0}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              سلسلة الأيام
            </div>
          </div>
          <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl p-5 text-center shadow-xl border border-white/30 dark:border-gray-700/30">
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">
              {progress?.level ?? "-"}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              المستوى
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 mb-8 border border-white/30 dark:border-gray-700/30">
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
            {[
              {
                key: "achievements",
                label: "الإنجازات",
                icon: "🏆",
                color: "from-yellow-500 to-orange-600",
              },
              {
                key: "progress",
                label: "التقدم",
                icon: "📊",
                color: "from-green-500 to-emerald-600",
              },
              {
                key: "recent",
                label: "الإنجازات الحديثة",
                icon: "⭐",
                color: "from-blue-500 to-indigo-600",
              },
              {
                key: "leaderboard",
                label: "المتصدرين",
                icon: "🏅",
                color: "from-purple-500 to-pink-600",
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                  activeTab === tab.key
                    ? `bg-gradient-to-r ${tab.color} text-white`
                    : "bg-white/70 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-white"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[420px]">
          {activeTab === "achievements" && renderAchievements()}
          {activeTab === "progress" && renderProgress()}
          {activeTab === "recent" && renderRecent()}
          {activeTab === "leaderboard" && renderLeaderboard()}
        </div>
      </div>
    </div>
  );
};
