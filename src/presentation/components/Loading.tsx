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
            className={`${textSizeClasses[size]} text-gray-700 font-semibold tracking-wide animate-pulse`}
          >
            {text}
          </p>
          {/* Loading dots animation */}
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
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
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 max-w-sm mx-4 transform transition-all duration-300 hover:scale-105">
          {loadingContent}
        </div>
      </div>
    );
  }

  // Return regular loading content
  return loadingContent;
};

// Demo component to showcase different variants
const LoadingDemo: React.FC = () => {
  const [showOverlay, setShowOverlay] = React.useState(false);
  const [currentVariant, setCurrentVariant] = React.useState<
    "default" | "video" | "dots" | "pulse" | "modern" | "gradient"
  >("modern");

  const variants: Array<
    "default" | "video" | "dots" | "pulse" | "modern" | "gradient"
  > = ["default", "modern", "gradient", "video", "dots", "pulse"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Professional Loading Component
          </h1>
          <p className="text-gray-600 text-lg">
            مكون تحميل احترافي مع أنيميشن متقدم
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <button
                  key={variant}
                  onClick={() => setCurrentVariant(variant)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentVariant === variant
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {variant}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowOverlay(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Show Overlay
            </button>
          </div>
        </div>

        {/* Loading Variants Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Current Variant Large */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              Current: {currentVariant}
            </h3>
            <div className="flex justify-center">
              <Loading
                variant={currentVariant}
                size="xl"
                text="Loading content..."
              />
            </div>
          </div>

          {/* Size Variations */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Size Variations
            </h3>
            <div className="space-y-6">
              {(["xs", "sm", "md", "lg"] as const).map((size) => (
                <div key={size} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 w-8">
                    {size}
                  </span>
                  <Loading variant={currentVariant} size={size} />
                </div>
              ))}
            </div>
          </div>

          {/* All Variants Preview */}
          <div className="lg:col-span-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">
              All Variants
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {variants.map((variant) => (
                <div key={variant} className="text-center space-y-3">
                  <div className="flex justify-center">
                    <Loading variant={variant} size="lg" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {variant}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay Demo */}
      {showOverlay && (
        <Loading
          variant="video"
          size="lg"
          text="Loading overlay demo..."
          isOverlay={true}
          backdrop={true}
        />
      )}

      {/* Auto-hide overlay after 3 seconds */}
      {/* 
        Move the timeout logic into a useEffect to avoid returning a Timeout object in render,
        which causes the lint error.
      */}
    </div>
  );
};

export default Loading;
