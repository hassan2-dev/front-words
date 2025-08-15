/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { apiClient } from "../../../core/utils/api";
import { API_ENDPOINTS } from "../../../core/config/api";
import { Loading } from "@/presentation/components";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface DailyStory {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isCompleted: boolean;
  wordsCount: number;
  readingTime: number;
  difficulty: string;
}

interface DailyStoriesResponse {
  totalCount: number;
  completedCount: number;
  stories: DailyStory[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  level: string;
}

export const TrainerStudentDailyStoriesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [dailyStories, setDailyStories] = useState<DailyStory[]>([]);
  const [stats, setStats] = useState({ totalCount: 0, completedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (id) {
      fetchStudentDetails();
      fetchDailyStories();
    }
  }, [id, selectedDate]);

  const fetchStudentDetails = async () => {
    try {
      const studentRes = await apiClient.get<Student>(
        API_ENDPOINTS.TRAINER.STUDENTS.GET(id!)
      );
      if (studentRes.success && studentRes.data) {
        setStudent(studentRes.data);
      }
    } catch (error) {
      console.error("Error fetching student details:", error);
    }
  };

  const fetchDailyStories = async () => {
    try {
        const storiesRes = await apiClient.get<DailyStoriesResponse>(
          `/trainer/daily-stories/student/${id}`
        );
      if (storiesRes.success && storiesRes.data) {
        setDailyStories(storiesRes.data.stories);
        setStats({
          totalCount: storiesRes.data.totalCount,
          completedCount: storiesRes.data.completedCount,
        });
      }
    } catch (error) {
      console.error("Error fetching daily stories:", error);
    }
    setLoading(false);
  };


  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700";
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-700";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "سهل";
      case "medium":
        return "متوسط";
      case "hard":
        return "صعب";
      default:
        return difficulty;
    }
  };

  const formatReadingTime = (minutes: number) => {
    return `${minutes} دقيقة`;
  };

  if (loading) {
    return (
      <Loading size="xl" variant="video" text="جاري تحميل القصص اليومية..." isOverlay />
    );
  }

  if (!student) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          لم يتم العثور على الطالب
        </h3>
        <button
          onClick={() => navigate("/trainer/students")}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          العودة إلى قائمة الطلاب
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <button
              onClick={() => navigate(`/trainer/students/${id}`)}
              className="text-blue-600 gap-2 dark:text-white hover:text-blue-700 dark:hover:text-blue-300 mb-4 flex items-center text-sm"
            >
              <ArrowRight size={16} />
              العودة إلى تفاصيل الطالب
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              القصص اليومية - {student.name}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              مراجعة القصص اليومية للطالب
            </p>
          </div>
        </div>
      </div>

     

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                إجمالي القصص
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalCount}
              </p>
            </div>
            <div className="text-2xl sm:text-3xl">📖</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                القصص المكتملة
              </p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.completedCount}
              </p>
            </div>
            <div className="text-2xl sm:text-3xl">✅</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                نسبة الإكمال
              </p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalCount > 0
                  ? Math.round((stats.completedCount / stats.totalCount) * 100)
                  : 0}
                %
              </p>
            </div>
            <div className="text-2xl sm:text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* قائمة القصص */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            القصص اليومية ({stats.totalCount})
          </h2>
        </div>

        <div className="p-4 sm:p-6">
          {dailyStories.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {dailyStories.map((story) => (
                <div
                  key={story.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 space-x-reverse mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {story.title || "قصة بدون عنوان"}
                        </h3>
                        {story.difficulty && (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getDifficultyColor(
                              story.difficulty
                            )}`}
                          >
                            {getDifficultyText(story.difficulty)}
                          </span>
                        )}
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            story.isCompleted
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700"
                          }`}
                        >
                          {story.isCompleted ? "مكتمل" : "قيد التقدم"}
                        </span>
                      </div>

                      <p dir="ltr" className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                        {story.content || "لا يوجد محتوى"}
                      </p>

                      <div className="flex justify-center sm:grid-cols-3 gap-4 text-sm">
                        
                       
                        <div className="text-center col-span-2 sm:col-span-1">
                          <div className="text-lg font-bold text-black dark:text-white">
                            {new Date(story.createdAt).toLocaleDateString(
                              "en-US"
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            تاريخ الإنشاء
                          </div>
                        </div>
                      </div>
                    </div>

                    
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📖</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                لا توجد قصص يومية
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                لا توجد قصص يومية للتاريخ المحدد
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
