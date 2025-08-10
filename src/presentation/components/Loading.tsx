import React from "react";

interface LoadingProps {
  // Basic props
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "video" | "dots" | "pulse" | "modern" | "gradient";
  text?: string;
  className?: string;

  // Overlay props
  isOverlay?: boolean;
  backdrop?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  size = "md",
  variant = "modern",
  text = "Loading...",
  className = "",
  isOverlay = false,
  backdrop = true,
}) => {
  // Size classes mapping
  const sizeClasses = {
    xs: "w-8 h-8",
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  // Text size mapping
  const textSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  // Handle video error and show fallback
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const target = e.target as HTMLVideoElement;
    target.style.display = "none";
    const fallback = target.nextElementSibling as HTMLElement;
    if (fallback) fallback.style.display = "flex";
  };

  // Render different spinner variants
  const renderSpinner = () => {
    switch (variant) {
      case "video":
        return (
          <div className={`relative ${sizeClasses[size]}`}>
            {/* Outer glow ring */}
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 blur-sm opacity-75 animate-pulse"></div>

            {/* Main spinner ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 animate-spin shadow-2xl"></div>

            {/* Video container */}
            <div className="absolute inset-1 rounded-full overflow-hidden bg-white shadow-inner">
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-cover rounded-full"
                style={{ backgroundColor: "#f8fafc" }}
                onError={handleVideoError}
              >
                <source src="/loading.mp4" type="video/mp4" />
              </video>

              {/* Enhanced fallback spinner */}
              <div
                className="w-full h-full bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center"
                style={{ display: "none" }}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-spin shadow-lg"></div>
              </div>
            </div>

            {/* Inner highlight ring */}
            <div className="absolute inset-0.5 rounded-full border border-white/30"></div>
          </div>
        );

      case "modern":
        return (
          <div className={`relative ${sizeClasses[size]}`}>
            {/* Outer ring with gradient */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-spin shadow-lg"></div>
            {/* Inner circle */}
            <div className="absolute inset-2 rounded-full bg-white shadow-inner"></div>
            {/* Center dot */}
            <div className="absolute inset-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
            {/* Highlight */}
            <div className="absolute inset-1 rounded-full border-2 border-white/20"></div>
          </div>
        );

      case "gradient":
        return (
          <div className={`relative ${sizeClasses[size]}`}>
            {/* Multiple rotating rings */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 animate-spin shadow-lg"></div>
            <div
              className="absolute inset-2 rounded-full border-4 border-transparent bg-gradient-to-r from-purple-500 to-pink-500 animate-spin animation-delay-300 shadow-md"
              style={{ animationDirection: "reverse" }}
            ></div>
            <div className="absolute inset-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse"></div>
          </div>
        );

      case "dots":
        return (
          <div className="flex space-x-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce shadow-md"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: "0.8s",
                }}
              />
            ))}
          </div>
        );

      case "pulse":
        return (
          <div className="relative">
            {/* Multiple pulse rings */}
            <div
              className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-ping absolute`}
            ></div>
            <div
              className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse shadow-xl`}
            ></div>
          </div>
        );

      default:
        return (
          <div className={`${sizeClasses[size]} relative`}>
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 shadow-inner"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin shadow-lg"></div>
          </div>
        );
    }
  };

  // Main loading content with enhanced styling
  const loadingContent = (
    <div
      className={`flex flex-col items-center justify-center space-y-6 ${className}`}
    >
      {renderSpinner()}
      {text && (
        <div className="text-center space-y-2">
          <p
            className={`${textSizeClasses[size]} text-black dark:text-white  tracking-wide animate-pulse`}
          >
            {text}
          </p>
        
        </div>
      )}
    </div>
  );

  // Enhanced overlay with better backdrop
  if (isOverlay) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
          backdrop ? "bg-black/60 backdrop-blur-sm" : "bg-transparent"
        }`}
      >
        <div className=" p-8 max-w-sm mx-4 transform transition-all duration-300 hover:scale-105">
          {loadingContent}
        </div>
      </div>
    );
  }

  // Return regular loading content
  return loadingContent;
};



export default Loading;
