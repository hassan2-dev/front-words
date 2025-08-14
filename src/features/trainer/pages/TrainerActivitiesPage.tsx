import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../../core/utils/api";
import { API_ENDPOINTS } from "../../../core/config/api";
import { Loading } from "@/presentation/components";
import { ArrowRight } from "lucide-react";

interface StudentActivity {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  activities: {
    storiesCreated: number;
    wordsLearned: number;
    wordsAdded: number;
    studyTime: number;
  };
  engagement: number;
  type: "daily" | "weekly" | "monthly";
}

interface ActivityResponse {
  date: string;
  activities: StudentActivity[];
  stats: {
    storiesCreated: number;
    wordsLearned: number;
    wordsAdded: number;
    studyTime: number;
    engagement: number;
  };
}

interface Student {
  id: string;
  name: string;
  email: string;
  level: string;
  isActive: boolean;
}

interface StudentStats {
  totalStoriesCreated: number;
  totalWordsLearned: number;
  totalWordsAdded: number;
  totalStudyTime: number;
  averageEngagement: number;
  studyStreak: number;
  lastActive: string;
}

export const TrainerActivitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [activities, setActivities] = useState<StudentActivity[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [studentName, setStudentName] = useState<string>("");

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentActivities();
    } else {
      setLoading(false);
    }
  }, [selectedStudentId, selectedPeriod, selectedDate]);

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const studentsRes = await apiClient.get<Student[]>("/trainer/students");
      if (studentsRes.success && studentsRes.data) {
        setStudents(studentsRes.data);
      } else {
        // بيانات تجريبية للطلاب
        setStudents([
          {
            id: "1",
            name: "أحمد محمد",
            email: "ahmed@example.com",
            level: "متوسط",
            isActive: true,
          },
          {
            id: "2",
            name: "فاطمة علي",
            email: "fatima@example.com",
            level: "مبتدئ",
            isActive: true,
          },
          {
            id: "3",
            name: "محمد حسن",
            email: "mohamed@example.com",
            level: "متقدم",
            isActive: false,
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      // بيانات تجريبية في حالة الخطأ
      setStudents([
        {
          id: "1",
          name: "أحمد محمد",
          email: "ahmed@example.com",
          level: "متوسط",
          isActive: true,
        },
        {
          id: "2",
          name: "فاطمة علي",
          email: "fatima@example.com",
          level: "مبتدئ",
          isActive: true,
        },
        {
          id: "3",
          name: "محمد حسن",
          email: "mohamed@example.com",
          level: "متقدم",
          isActive: false,
        },
      ]);
    }
    setStudentsLoading(false);
  };

  const fetchStudentActivities = async () => {
    setLoading(true);
    try {
      let endpoint = "";
      switch (selectedPeriod) {
        case "daily":
          endpoint = `/trainer/activities/student/${selectedStudentId}/daily/${selectedDate}`;
          break;
        case "weekly":
          endpoint = `/trainer/activities/student/${selectedStudentId}/weekly/${selectedDate}`;
          break;
        case "monthly":
          endpoint = `/trainer/activities/student/${selectedStudentId}/monthly/${selectedDate}`;
          break;
      }

      const activitiesRes = await apiClient.get<ActivityResponse>(endpoint);
      if (activitiesRes.success && activitiesRes.data) {
        const data = activitiesRes.data;
        // تحديث الإحصائيات من البيانات المستلمة
        if (data.stats) {
          setStudentStats({
            totalStoriesCreated: data.stats.storiesCreated,
            totalWordsLearned: data.stats.wordsLearned,
            totalWordsAdded: data.stats.wordsAdded,
            totalStudyTime: data.stats.studyTime,
            averageEngagement: data.stats.engagement,
            studyStreak: 7, // سيتم جلبها من endpoint منفصل
            lastActive: new Date().toISOString(),
          });

          // إنشاء نشاط واحد من البيانات الإحصائية إذا كانت المصفوفة فارغة
          if (data.activities.length === 0 && data.stats) {
            const selectedStudent = students.find(
              (s) => s.id === selectedStudentId
            );
            setActivities([
              {
                id: "1",
                studentId: selectedStudentId,
                studentName: selectedStudent?.name || "طالب",
                date: data.date,
                activities: {
                  storiesCreated: data.stats.storiesCreated,
                  wordsLearned: data.stats.wordsLearned,
                  wordsAdded: data.stats.wordsAdded,
                  studyTime: data.stats.studyTime,
                },
                engagement: data.stats.engagement,
                type: selectedPeriod,
              },
            ]);
          } else {
            setActivities(data.activities);
          }
        } else {
          setActivities(data.activities || []);
        }

        // تحديث اسم الطالب
        const selectedStudent = students.find(
          (s) => s.id === selectedStudentId
        );
        if (selectedStudent) {
          setStudentName(selectedStudent.name);
        }
      } else {
        // بيانات تجريبية للاختبار
        const selectedStudent = students.find(
          (s) => s.id === selectedStudentId
        );
        setActivities([
          {
            id: "1",
            studentId: selectedStudentId,
            studentName: selectedStudent?.name || "طالب",
            date: selectedDate,
            activities: {
              storiesCreated: 3,
              wordsLearned: 15,
              wordsAdded: 8,
              studyTime: 45,
            },
            engagement: 85,
            type: selectedPeriod,
          },
        ]);
        setStudentName(selectedStudent?.name || "طالب");
      }
    } catch (error) {
      console.error("Error fetching student activities:", error);
      // بيانات تجريبية في حالة الخطأ
      const selectedStudent = students.find((s) => s.id === selectedStudentId);
      setActivities([
        {
          id: "1",
          studentId: selectedStudentId,
          studentName: selectedStudent?.name || "طالب",
          date: selectedDate,
          activities: {
            storiesCreated: 3,
            wordsLearned: 15,
            wordsAdded: 8,
            studyTime: 45,
          },
          engagement: 85,
          type: selectedPeriod,
        },
      ]);
      setStudentName(selectedStudent?.name || "طالب");
    }
    setLoading(false);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}س ${mins}د` : `${mins}د`;
  };

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 80) return "text-green-600 dark:text-green-400";
    if (engagement >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getEngagementIcon = (engagement: number) => {
    if (engagement >= 80) return "🔥";
    if (engagement >= 60) return "📈";
    return "📉";
  };

  const getPeriodText = () => {
    switch (selectedPeriod) {
      case "daily":
        return "اليوم";
      case "weekly":
        return "الأسبوع";
      case "monthly":
        return "الشهر";
      default:
        return "اليوم";
    }
  };

  if (studentsLoading) {
    return (
      <Loading
        size="xl"
        variant="video"
        text="جاري تحميل قائمة الطلاب..."
        isOverlay
      />
    );
  }

  if (loading) {
    return (
      <Loading
        size="xl"
        variant="video"
        text="جاري تحميل أنشطة الطالب..."
        isOverlay
      />
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
              أنشطة الطلاب
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {selectedStudentId
                ? `مراقبة أنشطة وتقدم الطالب: ${studentName}`
                : "اختر طالباً لعرض أنشطته وتقدمه"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center sm:justify-end">
            {selectedStudentId && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {getPeriodText()}:{" "}
                {new Date(selectedDate).toLocaleDateString("ar-SA")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* إحصائيات عامة */}
      {selectedStudentId && studentStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  إجمالي القصص
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {studentStats.totalStoriesCreated}
                </p>
              </div>
              <div className="text-2xl sm:text-3xl">📖</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  إجمالي الكلمات
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {studentStats.totalWordsLearned}
                </p>
              </div>
              <div className="text-2xl sm:text-3xl">📝</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  أيام الدراسة
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {studentStats.studyStreak}
                </p>
              </div>
              <div className="text-2xl sm:text-3xl">🔥</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  متوسط التفاعل
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {studentStats.averageEngagement}%
                </p>
              </div>
              <div className="text-2xl sm:text-3xl">📊</div>
            </div>
          </div>
        </div>
      )}

      {/* اختيار الطالب */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4 sm:p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            اختر الطالب
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">اختر طالب...</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} - {student.level}{" "}
                {student.isActive ? "🟢" : "🔴"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* فلاتر البحث */}
      {selectedStudentId && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <button
                onClick={fetchStudentActivities}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
              >
                تحديث
              </button>
            </div>
          </div>
        </div>
      )}

      {/* تفاصيل الأنشطة */}
      {selectedStudentId && (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={activity.id || index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 hover:shadow-lg transition-shadow"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {activity.studentName || studentName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(activity.date).toLocaleDateString("ar-SA")} -{" "}
                      {getPeriodText()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${getEngagementColor(
                        activity.engagement
                      )}`}
                    >
                      {activity.engagement}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      مستوى التفاعل
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {activity.activities.storiesCreated}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      القصص المُنشأة
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {activity.activities.wordsLearned}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      الكلمات المُتعلمة
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                      {activity.activities.wordsAdded}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      الكلمات المُضافة
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                      {formatTime(activity.activities.studyTime)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      وقت الدراسة
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-lg">
                        {getEngagementIcon(activity.engagement)}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.engagement >= 80
                          ? "متفاعل جداً"
                          : activity.engagement >= 60
                          ? "متفاعل"
                          : "منخفض التفاعل"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${activity.engagement}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedStudentId && activities.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            لا توجد أنشطة
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            لا توجد أنشطة للطالب في الفترة المحددة
          </p>
        </div>
      )}

      {!selectedStudentId && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            اختر طالباً
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            اختر طالباً من القائمة أعلاه لعرض أنشطته وتقدمه
          </p>
        </div>
      )}
    </div>
  );
};
