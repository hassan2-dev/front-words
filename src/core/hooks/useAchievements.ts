import { useCallback } from 'react';
import { useAuth } from '../providers/AuthProvider';
import {
    completeStory,
    completeDailyWords,
    addPrivateWordsAchievement,
    learnWordsAchievement,
    studyStreakAchievement,
} from '../utils/api';

export const useAchievements = () => {
    const { user } = useAuth();

    const handleCompleteStory = useCallback(async (storyId: string, level: string, points: number) => {
        if (!user?.id) return null;

        try {
            const response = await completeStory({
                userId: user.id,
                storyId,
                level,
                points,
            });

            if (response.success && response.data?.achievement) {
                // يمكن إضافة إشعار هنا
                return response.data;
            }

            return response.data;
        } catch (error) {
            console.error('خطأ في تسجيل إنجاز القصة:', error);
            return null;
        }
    }, [user?.id]);

    const handleCompleteDailyWords = useCallback(async (date: string, count: number) => {
        if (!user?.id) return null;

        try {
            const response = await completeDailyWords({
                userId: user.id,
                date,
                count,
            });

            if (response.success && response.data?.achievement) {
                return response.data;
            }

            return response.data;
        } catch (error) {
            console.error('خطأ في تسجيل إنجاز الكلمات اليومية:', error);
            return null;
        }
    }, [user?.id]);

    const handleAddPrivateWords = useCallback(async (count: number) => {
        if (!user?.id) return null;

        try {
            const response = await addPrivateWordsAchievement({
                userId: user.id,
                count,
            });

            if (response.success && response.data?.achievement) {
                return response.data;
            }

            return response.data;
        } catch (error) {
            console.error('خطأ في تسجيل إنجاز الكلمات الخاصة:', error);
            return null;
        }
    }, [user?.id]);

    const handleLearnWords = useCallback(async (count: number, type: string = 'daily') => {
        if (!user?.id) return null;

        try {
            const response = await learnWordsAchievement({
                userId: user.id,
                count,
                type,
            });

            if (response.success && response.data?.achievement) {
                return response.data;
            }

            return response.data;
        } catch (error) {
            console.error('خطأ في تسجيل إنجاز تعلم الكلمات:', error);
            return null;
        }
    }, [user?.id]);

    const handleStudyStreak = useCallback(async (streakDays: number) => {   
        if (!user?.id) return null;

        try {
            const response = await studyStreakAchievement({
                userId: user.id,
                streakDays,
            });

            if (response.success && response.data?.achievement) {
                return response.data;
            }

            return response.data;
        } catch (error) {
            console.error('خطأ في تسجيل إنجاز الاستمرارية:', error);
            return null;
        }
    }, [user?.id]);

    return {
        completeStory: handleCompleteStory,
        completeDailyWords: handleCompleteDailyWords,
        addPrivateWords: handleAddPrivateWords,
        learnWords: handleLearnWords,
        studyStreak: handleStudyStreak,
    };
}; 