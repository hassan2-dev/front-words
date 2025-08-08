import React from "react";
import {
  showLoadingToast,
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from "./ToastWithLoading";

const ToastDemo: React.FC = () => {
  const handleShowLoadingToast = () => {
    showLoadingToast({
      message: "جاري تحميل البيانات...",
      duration: 3000,
      variant: "video",
      size: "md",
    });
  };

  const handleShowSuccessToast = () => {
    showSuccessToast("تم حفظ البيانات بنجاح! ✅");
  };

  const handleShowErrorToast = () => {
    showErrorToast("حدث خطأ أثناء حفظ البيانات! ❌");
  };

  const handleShowInfoToast = () => {
    showInfoToast("معلومات مهمة للمستخدم ℹ️");
  };

  const handleShowCustomLoadingToast = () => {
    showLoadingToast({
      message: "جاري معالجة الطلب...",
      duration: 5000,
      variant: "dots",
      size: "lg",
      position: "bottom-center",
    });
  };

  const handleShowVideoLoadingToast = () => {
    showLoadingToast({
      message: "جاري تحميل الفيديو...",
      duration: 4000,
      variant: "video",
      size: "lg",
      position: "top-right",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Toast with Loading Demo
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Loading Toast */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Loading Toast</h3>
            <p className="text-gray-600 mb-4">
              Toast مع مكون Loading فيديو مدمج
            </p>
            <button
              onClick={handleShowLoadingToast}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              عرض Loading Toast
            </button>
          </div>

          {/* Success Toast */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Success Toast</h3>
            <p className="text-gray-600 mb-4">Toast نجاح مع رسالة تأكيد</p>
            <button
              onClick={handleShowSuccessToast}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              عرض Success Toast
            </button>
          </div>

          {/* Error Toast */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Error Toast</h3>
            <p className="text-gray-600 mb-4">Toast خطأ مع رسالة تنبيه</p>
            <button
              onClick={handleShowErrorToast}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              عرض Error Toast
            </button>
          </div>

          {/* Info Toast */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Info Toast</h3>
            <p className="text-gray-600 mb-4">Toast معلومات مع رسالة توضيحية</p>
            <button
              onClick={handleShowInfoToast}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              عرض Info Toast
            </button>
          </div>

          {/* Custom Loading Toast */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Custom Loading</h3>
            <p className="text-gray-600 mb-4">Loading Toast مخصص مع dots</p>
            <button
              onClick={handleShowCustomLoadingToast}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              عرض Custom Loading
            </button>
          </div>

          {/* Video Loading Toast */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Video Loading</h3>
            <p className="text-gray-600 mb-4">Loading Toast مع فيديو كبير</p>
            <button
              onClick={handleShowVideoLoadingToast}
              className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              عرض Video Loading
            </button>
          </div>

          {/* All Toasts */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">All Toasts</h3>
            <p className="text-gray-600 mb-4">عرض جميع أنواع Toast</p>
            <button
              onClick={() => {
                showLoadingToast({
                  message: "جاري التحميل...",
                  duration: 2000,
                });
                setTimeout(() => showSuccessToast("تم التحميل بنجاح!"), 2500);
              }}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors"
            >
              عرض جميع الأنواع
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">كيفية الاستخدام</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>showLoadingToast:</strong> عرض toast مع مكون Loading مدمج
            </p>
            <p>
              <strong>showSuccessToast:</strong> عرض toast نجاح مع أيقونة
            </p>
            <p>
              <strong>showErrorToast:</strong> عرض toast خطأ مع أيقونة
            </p>
            <p>
              <strong>showInfoToast:</strong> عرض toast معلومات مع أيقونة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToastDemo;
