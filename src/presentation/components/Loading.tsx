import React from "react";

interface LoadingProps {
  // Basic props
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "video" | "dots" | "pulse";
  text?: string;
  className?: string;

  // Overlay props
  isOverlay?: boolean;
  backdrop?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  size = "md",
  variant = "default",
  text,
  className = "",
  isOverlay = false,
  backdrop = true,
}) => {
  const sizeClasses = {
    xs: "w-8 h-8",
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
    xl: "w-24 h-24",
  };

  const renderSpinner = () => {
    switch (variant) {
      case "video":
        return (
          <div className={`relative ${sizeClasses[size]}`}>
            {/* Animated gradient background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse"></div>

            {/* Video container with rounded corners */}
            <div className="absolute inset-1 rounded-full overflow-hidden bg-white shadow-xl">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              >
                <source src="/loading.mp4" type="video/mp4" />
              </video>
            </div>

            {/* Rotating border */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-border animate-spin"></div>
          </div>
        );

      case "dots":
        return (
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        );

      case "pulse":
        return (
          <div
            className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse`}
          ></div>
        );

      default:
        return (
          <div className={`${sizeClasses[size]} relative`}>
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
        );
    }
  };

  const loadingContent = (
    <div
      className={`flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      {renderSpinner()}
      {text && (
        <p className="text-sm text-gray-600 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  // If it's an overlay, wrap with overlay container
  if (isOverlay) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          backdrop ? "bg-black bg-opacity-50" : ""
        }`}
      >
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm mx-4">
          {loadingContent}
        </div>
      </div>
    );
  }

  return loadingContent;
};

export default Loading;
