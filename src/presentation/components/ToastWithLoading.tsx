import React from "react";
import toast from "react-hot-toast";
import Loading from "./Loading";

interface ToastWithLoadingProps {
  message: string;
  duration?: number;
  position?:
    | "top-center"
    | "top-right"
    | "top-left"
    | "bottom-center"
    | "bottom-right"
    | "bottom-left";
  variant?: "default" | "video" | "dots" | "pulse";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

// Toast مع Loading مدمج
export const showLoadingToast = ({
  message,
  duration = 3000,
  position = "top-center",
  variant = "video",
  size = "md",
}: ToastWithLoadingProps) => {
  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-center space-x-3">
            {/* Loading component as part of toast */}
            <div className="flex-shrink-0">
              <Loading variant={variant} size={size} className="text-center" />
            </div>
            {/* Message text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            إغلاق
          </button>
        </div>
      </div>
    ),
    {
      duration,
      position,
    }
  );
};

// Toast نجاح مع أيقونة
export const showSuccessToast = (message: string) => {
  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-green-50 border border-green-200 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-green-500 ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-green-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-green-600 hover:text-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            إغلاق
          </button>
        </div>
      </div>
    ),
    {
      duration: 4000,
      position: "top-center",
    }
  );
};

// Toast خطأ مع أيقونة
export const showErrorToast = (message: string) => {
  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-red-50 border border-red-200 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-red-500 ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-red-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            إغلاق
          </button>
        </div>
      </div>
    ),
    {
      duration: 4000,
      position: "top-center",
    }
  );
};

// Toast معلومات مع أيقونة
export const showInfoToast = (message: string) => {
  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-blue-50 border border-blue-200 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-blue-500 ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-800">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-blue-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            إغلاق
          </button>
        </div>
      </div>
    ),
    {
      duration: 4000,
      position: "top-center",
    }
  );
};

// مكون Toast مع Loading مدمج
export const ToastWithLoading: React.FC<ToastWithLoadingProps> = ({
  message,
  duration = 3000,
  position = "top-center",
  variant = "video",
  size = "md",
}) => {
  React.useEffect(() => {
    showLoadingToast({
      message,
      duration,
      position,
      variant,
      size,
    });
  }, [message, duration, position, variant, size]);

  return null;
};
