import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { ROUTES } from "../constants/app";

// Loading Component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
        <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
      </div>
      <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
        جاري التحميل...
      </p>
    </div>
  </div>
);

// Protected Route Props
interface ProtectedRouteProps {
  children: ReactNode;
}

// Protected Route Component
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />
    );
  }

  // Render children if authenticated
  return <>{children}</>;
};
