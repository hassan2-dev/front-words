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

      // Fetch achievements
      const achievementsRes = await getMyAchievements();
      if (achievementsRes.success && achievementsRes.data) {
        setAchievements(achievementsRes.data.achievements || []);
        setTotalPoints(achievementsRes.data.totalPoints || 0);
      }

      // Fetch progress
      const progressRes = await getMyAchievementProgress();
      if (progressRes.success && progressRes.data) {
        setProgress(progressRes.data as unknown as AchievementProgress);
      }

      // Fetch recent achievements
      const recentRes = await getMyRecentAchievements({ limit: 5 });
      if (recentRes.success && recentRes.data) {
        setRecentAchievements(recentRes.data as unknown as UserAchievement[]);
      }

      // Fetch leaderboard
      const leaderboardRes = await getLeaderboard({ limit: 10 });
      if (leaderboardRes.success && leaderboardRes.data) {
        setLeaderboard(leaderboardRes.data as unknown as LeaderboardEntry[]);
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-12">جاري تحميل الإنجازات...</div>;
  }

  const renderAchievements = () => (
    <div className="grid grid-cols-1 gap-6">
      {achievements.map((userAchievement) => (
        <div
          key={userAchievement.id}
          className={`rounded-xl p-5 shadow-lg flex items-center gap-4 ${
            userAchievement.achievement.achieved
              ? "bg-white dark:bg-gray-800 border-l-4 border-green-500"
              : "bg-gray-100 dark:bg-gray-700 opacity-60"
          }`}
        >
          <div className="flex-shrink-0 text-2xl">
            {userAchievement.achievement.achieved ? "🏆" : "🔒"}
          </div>
          <div className="flex-1">
            <div className="font-bold text-lg mb-1">
              {userAchievement.achievement.name}
            </div>
            <div className="text-gray-600 dark:text-gray-400 mb-1">
              {userAchievement.achievement.description}
            </div>
            {userAchievement.achievement.achieved &&
              userAchievement.achievedAt && (
                <div className="text-xs text-green-600 dark:text-green-400">
                  تم تحقيقه بتاريخ:{" "}
                  {new Date(userAchievement.achievedAt).toLocaleDateString()}
                </div>
              )}
            <div className="text-xs text-blue-600 dark:text-blue-400">
              نقاط الإنجاز: {userAchievement.achievement.points}
            </div>
            {userAchievement.progress > 0 && userAchievement.progress < 100 && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">
                  التقدم: {userAchievement.progress}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${userAchievement.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
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
        recentAchievements.map((userAchievement) => (
          <div
            key={userAchievement.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg flex items-center gap-4 border-l-4 border-green-500"
          >
            <div className="flex-shrink-0 text-2xl">🏆</div>
            <div className="flex-1">
              <div className="font-bold text-lg">
                {userAchievement.achievement.name}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                {userAchievement.achievement.description}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                تم تحقيقه:{" "}
                {new Date(userAchievement.achievedAt).toLocaleDateString()}
              </div>
            </div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              +{userAchievement.achievement.points}
            </div>
          </div>
        ))
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
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-700 dark:text-blue-300">
        إنجازاتي
      </h1>

      <div className="mb-8 text-center">
        <span className="text-lg text-gray-700 dark:text-gray-300">
          رصيد النقاط:
        </span>
        <span className="text-2xl font-bold text-green-600 dark:text-green-400 ml-2">
          {totalPoints}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {[
          { key: "achievements", label: "الإنجازات", icon: "🏆" },
          { key: "progress", label: "التقدم", icon: "📊" },
          { key: "recent", label: "الإنجازات الحديثة", icon: "⭐" },
          { key: "leaderboard", label: "المتصدرين", icon: "🏅" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === "achievements" && renderAchievements()}
        {activeTab === "progress" && renderProgress()}
        {activeTab === "recent" && renderRecent()}
        {activeTab === "leaderboard" && renderLeaderboard()}
      </div>
    </div>
  );
};
