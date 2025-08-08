import React, { useState } from "react";
import Loading from "./Loading";

const LoadingDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleTestLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Loading Component Demo
        </h1>

        {/* Test Button */}
        <div className="text-center mb-8">
          <button
            onClick={handleTestLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Test Loading Overlay (3 seconds)
          </button>
        </div>

        {/* Loading Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Video Loading */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Video Loading</h3>
            <Loading variant="video" size="lg" text="جاري التحميل..." />
          </div>

          {/* Default Loading */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Default Loading</h3>
            <Loading size="lg" />
          </div>

          {/* Dots Loading */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Dots Loading</h3>
            <Loading variant="dots" text="Loading..." />
          </div>

          {/* Pulse Loading */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Pulse Loading</h3>
            <Loading variant="pulse" size="lg" />
          </div>

          {/* Different Sizes */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Different Sizes</h3>
            <div className="flex items-center space-x-4">
              <Loading variant="video" size="xs" />
              <Loading variant="video" size="sm" />
              <Loading variant="video" size="md" />
              <Loading variant="video" size="lg" />
              <Loading variant="video" size="xl" />
            </div>
          </div>

          {/* Video with different backgrounds */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Video Loading (Large)</h3>
            <Loading 
              variant="video" 
              size="xl" 
              text="جاري تحميل البيانات..." 
            />
          </div>
        </div>

        {/* Full Screen Loading Overlay */}
        {isLoading && (
          <Loading isOverlay variant="video" size="xl" text="جاري تسجيل الدخول..." />
        )}
      </div>
    </div>
  );
};

export default LoadingDemo;
