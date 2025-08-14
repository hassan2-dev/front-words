import React, { useState, useEffect } from "react";
import { apiClient } from "../../../core/utils/api";
import { API_ENDPOINTS } from "../../../core/config/api";
import { Loading } from "@/presentation/components";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  level: string;
  progress: number;
  lastActive: string;
  totalWordsLearned: number;
  totalWordsAdded: number;
  storiesCreated: number;
  dailyStoriesCount?: number; // إضافة عدد القصص اليومية
  studyStreak: number;
  isActive: boolean;
}

interface StudentActivity {
  id: string;
  studentId: string;
  date: string;
  activities: {
    storiesCreated: number;
    wordsLearned: number;
    wordsAdded: number;
    studyTime: number;
  };
  engagement: number;
}

interface DailyActivity {
  date: string;
  storiesCreated: number;
  wordsLearned: number;
  wordsAdded: number;
  studyTime: number;
  engagement: number;
}

export const TrainerStudentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedPeriod, setSelectedPeriod] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchStudentDetails();
      fetchStudentActivities();
    }
  }, [id, selectedDate, selectedPeriod]);

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

  const fetchStudentActivities = async () => {
    try {
      let endpoint = "";
      switch (selectedPeriod) {
        case "daily":
          endpoint = API_ENDPOINTS.TRAINER.ACTIVITIES.STUDENT_DAILY(
            id!,
            selectedDate
          );
          break;
        case "weekly":
          endpoint = API_ENDPOINTS.TRAINER.ACTIVITIES.STUDENT_WEEKLY(
            id!,
            selectedDate
          );
          break;
        case "monthly":
          endpoint = API_ENDPOINTS.TRAINER.ACTIVITIES.STUDENT_MONTHLY(
            id!,
            selectedDate
          );
          break;
      }

      const activitiesRes = await apiClient.get<DailyActivity[]>(endpoint);
      if (activitiesRes.success && activitiesRes.data) {
        setDailyActivities(activitiesRes.data);
      }
    } catch (error) {
      console.error("Error fetching student activities:", error);
    }
    setLoading(false);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "L1":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700";
      case "L2":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700";
      case "L3":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-700";
      case "L4":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700";
      case "L5":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-700";
      case "L6":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-700";
      case "L7":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-700";
      case "L8":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case "L1":
        return "المستوى 1";
      case "L2":
        return "المستوى 2";
      case "L3":
        return "المستوى 3";
      case "L4":
        return "المستوى 4";
      case "L5":
        return "المستوى 5";
      case "L6":
        return "المستوى 6";
      case "L7":
        return "المستوى 7";
      case "L8":
        return "المستوى 8";
      default:
        return level;
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}س ${mins}د` : `${mins}د`;
  };

  if (loading) {
    return (
      <Loading
        size="xl"
        variant="video"
        text="جاري تحميل تفاصيل الطالب..."
        isOverlay
      />
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
        <button
          onClick={() => navigate("/trainer/students")}
          className="text-blue-600 gap-2 dark:text-white hover:text-blue-700 dark:hover:text-blue-300 mb-4 flex items-center text-sm"
        >
          <ArrowRight size={16} />
          العودة إلى قائمة الطلاب
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {student.name}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {student.email}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center sm:justify-end">
            <span
              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getLevelColor(
                student.level
              )}`}
            >
              {getLevelText(student.level)}
            </span>
            <button
              onClick={() =>
                navigate(`/trainer/students/${student.id}/daily-stories`)
              }
              className="text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 min-w-[100px]"
            >
              عرض القصص اليومية
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 justify-end">
          <span
            className={`w-3 h-3 rounded-full ${
              student.isActive ? "bg-green-500" : "bg-gray-400"
            }`}
          ></span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {student.isActive ? "نشط" : "غير نشط"}
          </span>
        </div>
      </div>

      {/* إحصائيات عامة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                التقدم العام
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {student.progress}%
              </p>
            </div>
            <div className="text-2xl sm:text-3xl">📈</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                الكلمات المُتعلمة
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {student.totalWordsLearned}
              </p>
            </div>
            <div className="text-2xl sm:text-3xl">📝</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                القصص المُنشأة
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {student.storiesCreated}
              </p>
            </div>
            <div className="text-2xl sm:text-3xl">📖</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                القصص اليومية
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {student.dailyStoriesCount || 0}
              </p>
            </div>
            <div className="text-2xl sm:text-3xl">📅</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                أيام الدراسة المتتالية
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {student.studyStreak}
              </p>
            </div>
            <div className="text-2xl sm:text-3xl">🔥</div>
          </div>
        </div>
      </div>

      {/* أدوات التصفية */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الفترة الزمنية
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) =>
                setSelectedPeriod(
                  e.target.value as "daily" | "weekly" | "monthly"
                )
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="daily">يومي</option>
              <option value="weekly">أسبوعي</option>
              <option value="monthly">شهري</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              التاريخ
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          <div className="flex items-end">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg w-full">
              <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">
                آخر نشاط: {student.lastActive}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* تفاصيل النشاط */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            تفاصيل النشاط -{" "}
            {selectedPeriod === "daily"
              ? "اليوم"
              : selectedPeriod === "weekly"
              ? "الأسبوع"
              : "الشهر"}
          </h2>
        </div>

        <div className="p-4 sm:p-6">
          {dailyActivities.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {dailyActivities.map((activity, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6"
                >
                  {/* عرض للشاشات الكبيرة */}
                  <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                        {activity.storiesCreated}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        القصص المُنشأة
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                        {activity.wordsLearned}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        الكلمات المُتعلمة
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                        {activity.wordsAdded}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        الكلمات المُضافة
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                        {formatTime(activity.studyTime)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        وقت الدراسة
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-pink-600 dark:text-pink-400 mb-2">
                        {activity.engagement}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        مستوى التفاعل
                      </div>
                    </div>
                  </div>

                  {/* عرض للشاشات الصغيرة */}
                  <div className="md:hidden">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {activity.storiesCreated}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          القصص المُنشأة
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {activity.wordsLearned}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          الكلمات المُتعلمة
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {activity.wordsAdded}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          الكلمات المُضافة
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                          {formatTime(activity.studyTime)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          وقت الدراسة
                        </div>
                      </div>
                      <div className="text-center col-span-2">
                        <div className="text-lg font-bold text-pink-600 dark:text-pink-400">
                          {activity.engagement}%
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          مستوى التفاعل
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        التاريخ: {activity.date}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 sm:w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${activity.engagement}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">التفاعل</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                لا توجد بيانات نشاط
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                لا توجد بيانات نشاط للفترة المحددة
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
