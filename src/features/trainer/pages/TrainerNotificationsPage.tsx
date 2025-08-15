/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { apiClient } from "../../../core/utils/api";
import { API_ENDPOINTS } from "../../../core/config/api";
import { Loading } from "@/presentation/components";

interface Student {
  id: string;
  name: string;
  email: string;
  level: string;
  isActive: boolean;
}

interface SendNotificationData {
  studentId?: string; // optional for sending to all students
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export const TrainerNotificationsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form state for sending notifications
  const [sendForm, setSendForm] = useState<SendNotificationData>({
    studentId: "",
    title: "",
    message: "",
    type: "info",
  });

  const [sendToAll, setSendToAll] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const studentsRes = await apiClient.get<any>("/trainer/students");

      if (studentsRes.success && studentsRes.data && studentsRes.data.data) {
        setStudents(studentsRes.data.data);
      } else if (
        studentsRes.success &&
        studentsRes.data &&
        Array.isArray(studentsRes.data)
      ) {
        // إذا كانت البيانات مباشرة في data
        setStudents(studentsRes.data);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      // بيانات تجريبية في حالة الخطأ
    }
    setLoading(false);
  };

  const sendNotification = async () => {
    if (!sendForm.title || !sendForm.message) {
      alert("يرجى ملء العنوان والرسالة");
      return;
    }

    if (!sendToAll && !sendForm.studentId) {
      alert("يرجى اختيار طالب أو تحديد إرسال للجميع");
      return;
    }

    setSending(true);
    try {
      // تخصيص العنوان والرسالة
      const notificationTypeText = {
        info: "معلومات",
        success: "نجاح",
        warning: "تحذير",
        error: "تنبيه",
      };

      const trainerName = "مدرب Letspeak"; // يمكن جلبها من context أو API
      const customizedTitle = `[${notificationTypeText[sendForm.type]}] ${
        sendForm.title
      } - ${trainerName}`;
      const customizedMessage = `أود أن أعلمك أن ${sendForm.message}`;

      const notificationData = {
        title: customizedTitle,
        message: customizedMessage,
        studentId: sendToAll ? undefined : sendForm.studentId,
      };

      await apiClient.post("/trainer/notifications/send", notificationData);

      // إعادة تعيين النموذج
      setSendForm({
        studentId: "",
        title: "",
        message: "",
        type: "info",
      });
      setSendToAll(false);

      alert(
        sendToAll
          ? "تم إرسال الإشعار لجميع الطلاب بنجاح"
          : "تم إرسال الإشعار بنجاح"
      );
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("حدث خطأ أثناء إرسال الإشعار");
    }
    setSending(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "ℹ️";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "success":
        return "نجاح";
      case "warning":
        return "تحذير";
      case "error":
        return "تنبيه";
      default:
        return "معلومات";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "مبتدئ":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "متوسط":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "متقدم":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (loading) {
    return (
      <Loading
        size="xl"
        variant="video"
        text="جاري تحميل قائمة الطلاب..."
        isOverlay
      />
    );
  }

  const activeStudents = students.filter((s) => s.isActive);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          إرسال الإشعارات - Letspeak
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          إرسال إشعارات مخصصة للطلاب باسم معهد Letspeak
        </p>
        {students.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            تم تحميل {students.length} طالب ({activeStudents.length} نشط)
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* قائمة الطلاب */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              الطلاب النشطين
            </h3>

            {/* خيار إرسال للجميع */}
            <div className="mb-4">
              <button
                onClick={() => {
                  setSendToAll(true);
                  setSendForm({ ...sendForm, studentId: "" });
                }}
                className={`w-full p-3 rounded-lg border-2 transition-all ${
                  sendToAll
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 text-lg">
                        👥
                      </span>
                    </div>
                    <div className="text-right">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        جميع الطلاب
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activeStudents.length} طالب نشط
                      </p>
                    </div>
                  </div>
                  {sendToAll && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* قائمة الطلاب الفرديين */}
            <div className="space-y-2">
              {activeStudents.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  لا يوجد طلاب نشطين
                </div>
              )}
              {activeStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => {
                    setSendToAll(false);
                    setSendForm({ ...sendForm, studentId: student.id });
                  }}
                  className={`w-full p-3 rounded-lg border-2 transition-all ${
                    !sendToAll && sendForm.studentId === student.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                      <div className="text-right">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {student.name}
                        </h4>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(
                              student.level
                            )}`}
                          >
                            {student.level}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {student.email}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!sendToAll && sendForm.studentId === student.id && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* نموذج الإشعار */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              إرسال إشعار جديد
            </h3>

            <div className="space-y-4">
              {/* نوع الإشعار */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نوع الإشعار
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: "info", label: "معلومات", icon: "ℹ️" },
                    { value: "success", label: "نجاح", icon: "✅" },
                    { value: "warning", label: "تحذير", icon: "⚠️" },
                    { value: "error", label: "خطأ", icon: "❌" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() =>
                        setSendForm({ ...sendForm, type: type.value as any })
                      }
                      className={`p-3 rounded-lg border-2 transition-all ${
                        sendForm.type === type.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-blue-300"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-xl mb-1">{type.icon}</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {type.label}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* العنوان */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  العنوان
                </label>
                <input
                  type="text"
                  value={sendForm.title}
                  onChange={(e) =>
                    setSendForm({ ...sendForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="عنوان الإشعار"
                />
              </div>

              {/* الرسالة */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الرسالة
                </label>
                <textarea
                  value={sendForm.message}
                  onChange={(e) =>
                    setSendForm({ ...sendForm, message: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="محتوى الرسالة (سيتم إضافة 'أود أن أعلمك أن' تلقائياً)"
                />
              </div>

              {/* معاينة الإشعار */}
              {(sendForm.title || sendForm.message) && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    معاينة الإشعار:
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        العنوان:
                      </span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {sendForm.title
                          ? `[${getTypeText(sendForm.type)}] ${
                              sendForm.title
                            } - مدرب Letspeak`
                          : "سيظهر العنوان هنا"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        الرسالة:
                      </span>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {sendForm.message
                          ? `أود أن أعلمك أن ${sendForm.message}`
                          : "ستظهر الرسالة هنا"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* أزرار الإرسال */}
              <div className="flex space-x-4 space-x-reverse pt-4">
                <button
                  onClick={sendNotification}
                  disabled={
                    sending ||
                    !sendForm.title ||
                    !sendForm.message ||
                    (!sendToAll && !sendForm.studentId)
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-md transition-colors text-sm font-medium"
                >
                  {sending ? "جاري الإرسال..." : "إرسال الإشعار"}
                </button>
                <button
                  onClick={() => {
                    setSendForm({
                      studentId: "",
                      title: "",
                      message: "",
                      type: "info",
                    });
                    setSendToAll(false);
                  }}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors text-sm font-medium"
                >
                  إعادة تعيين
                </button>
              </div>
            </div>
          </div>

          {/* معلومات الإرسال */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              معلومات الإرسال - Letspeak Institute
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p>• سيتم إرسال الإشعارات باسم "مدرب Letspeak" تلقائياً</p>
              <p>
                • سيتم إضافة نوع الإشعار في العنوان: [معلومات]، [نجاح]، [تحذير]،
                [تنبيه]
              </p>
              <p>• سيتم إضافة "أود أن أعلمك أن" تلقائياً في بداية الرسالة</p>
              <p>• الإشعارات ستظهر للطلاب في تطبيقهم مع هوية معهد Letspeak</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
