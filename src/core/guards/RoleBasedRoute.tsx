import React, { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { ROUTES } from "../constants/app";
import { Loading } from "@/presentation/components";
import {
  validateUserRole,
  getRedirectPath,
  logUnauthorizedAccess,
} from "../utils/routeGuard";
import toast from "react-hot-toast";

// Loading Component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <Loading
      size="lg"
      variant="video"
      text="جاري التحقق من الصلاحيات..."
      isOverlay
    />
  </div>
);

// Unauthorized Component
const UnauthorizedPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="mb-8">
        <div className="w-24 h-24 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        غير مصرح لك
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        ليس لديك الصلاحيات المطلوبة للوصول إلى هذه الصفحة. يرجى التواصل مع
        المسؤول إذا كنت تعتقد أن هذا خطأ.
      </p>
      <button
        onClick={() => {
          localStorage.clear();
          window.location.href = ROUTES.LOGIN;
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
      >
        العودة للخلف
      </button>
    </div>
  </div>
);

// Role Based Route Props
interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
  showUnauthorized?: boolean;
}

// Role Based Route Component
export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  fallbackPath = ROUTES.DASHBOARD,
  showUnauthorized = true,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Handle nested user structure
  const actualUser = (user as any)?.user || user;

  // Strict authentication and role validation using utility functions
  const isUserAuthenticated =
    isAuthenticated && actualUser && actualUser.id && actualUser.role;
  const hasRequiredRole = validateUserRole(user, allowedRoles);

  // Log unauthorized access attempts using utility function
  useEffect(() => {
    if (isUserAuthenticated && !hasRequiredRole) {
      logUnauthorizedAccess(location.pathname, actualUser?.role, allowedRoles);
      toast.error("ليس لديك صلاحية للوصول إلى هذه الصفحة");
    }
  }, [
    location.pathname,
    isUserAuthenticated,
    hasRequiredRole,
    actualUser?.role,
    allowedRoles,
  ]);

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isUserAuthenticated) {
    console.warn("User not authenticated, redirecting to login");
    return (
      <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />
    );
  }

  // Check if user has required role
  if (!hasRequiredRole) {
    if (showUnauthorized) {
      return <UnauthorizedPage />;
    } else {
      // Redirect to appropriate dashboard based on user role using utility function
      const redirectPath = getRedirectPath(actualUser?.role);
      console.warn(`Redirecting unauthorized user to: ${redirectPath}`);
      return <Navigate to={redirectPath} replace />;
    }
  }

  // Render children if user has required role
  return <>{children}</>;
};
