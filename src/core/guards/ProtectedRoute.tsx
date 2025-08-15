/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { ROUTES } from "../constants/app";
import { Loading } from "@/presentation/components";
import {
  validateAuthentication,
  clearAuthData,
  getRedirectPath,
} from "../utils/routeGuard";
import toast from "react-hot-toast";

// Loading Component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <Loading size="lg" variant="video" text="جاري التحميل..." isOverlay />
  </div>
);

// Protected Route Props
interface ProtectedRouteProps {
  children: ReactNode;
}

// Protected Route Component
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Handle nested user structure
  const actualUser = (user as any)?.user || user;

  // Strict authentication validation using utility function
  const isUserAuthenticated = validateAuthentication(user, isAuthenticated);

  // Log authentication issues
  useEffect(() => {
    if (!isLoading && !isUserAuthenticated) {
     
      toast.error("يرجى تسجيل الدخول مرة أخرى");
    }
  }, [
    location.pathname,
    isLoading,
    isUserAuthenticated,
    user,
    actualUser,
    isAuthenticated,
  ]);

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isUserAuthenticated) {
      // Clear any invalid data using utility function
    clearAuthData();

    return (
      <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />
    );
  }

  // Render children if authenticated
  return <>{children}</>;
};
