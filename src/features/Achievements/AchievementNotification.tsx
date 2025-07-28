import React, { useEffect, useState } from "react";
import type { Achievement } from "../../core/types";

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
  isVisible: boolean;
}

export const AchievementNotification: React.FC<
  AchievementNotificationProps
> = ({ achievement, onClose, isVisible }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible && achievement) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onClose();
      }, 5000); // إخفاء بعد 5 ثواني

      return () => clearTimeout(timer);
    }
  }, [isVisible, achievement, onClose]);

  if (!isVisible || !achievement) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl shadow-2xl p-6 max-w-sm transform transition-all duration-500 ${
          isAnimating ? "translate-x-0 scale-100" : "translate-x-full scale-95"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="text-4xl animate-bounce">
            {achievement.icon || "🏆"}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">مبروك! 🎉</h3>
            <p className="text-sm mb-2">{achievement.name}</p>
            <p className="text-xs opacity-90">{achievement.description}</p>
            <div className="text-lg font-bold mt-2">
              +{achievement.points} نقطة
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Progress bar animation */}
        <div className="mt-4 w-full bg-white bg-opacity-20 rounded-full h-1">
          <div
            className="bg-white h-1 rounded-full animate-pulse"
            style={{ width: "100%" }}
          ></div>
        </div>
      </div>
    </div>
  );
};
