import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Core Providers
import { AuthProvider } from "./core/providers/AuthProvider";
import { ThemeProvider } from "./core/providers/ThemeProvider";

// Presentation Layouts
import { MainLayout } from "./presentation/layouts/MainLayout";
import { AuthLayout } from "./presentation/layouts/AuthLayout";

// Feature Pages
import { DailyWordsPage } from "./features/daily-words/pages/DailyWordsPage";
import { StoriesPage } from "./features/stories/pages/StoriesPage";
import { StoryReaderPage } from "./features/stories/pages/StoryReaderPage";
import { StoryExamPage } from "./features/stories/pages/StoryExamPage";
import { AchievementsPage } from "./features/Achievements/AchievementsPage";
import { AchievementsAdminPage } from "./features/Achievements/AchievementsAdminPage";
import ChatWithAIPage from "./features/chat-with-ai/pages/ChatWithAIPage";

// Core Guards
import { ProtectedRoute } from "./core/guards/ProtectedRoute";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { NotificationsPage } from "./features/notifications/pages/NotificationsPage";
import { RoleBasedRoute } from "./core/guards/RoleBasedRoute";
import { ProfilePage } from "./features/profile/pages/ProfilePage";
import {
  AdminDashboard,
  AdminOverviewPage,
  AdminUsersPage,
  AdminContentPage,
} from "./features/admin/pages";
import { TrainerDashboard } from "./features/trainer/pages/TrainerDashboard";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import LoginPage from "./features/auth/pages/LoginPage";
import { useAuth } from "./core/providers/AuthProvider";
import { ROUTES, USER_ROLES } from "./core/constants/app";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Home Redirect Component
const HomeRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for authentication to complete
    if (isLoading) return;

    // Handle nested user structure
    const actualUser = (user as any)?.user || user;

    if (actualUser?.role === USER_ROLES.ADMIN) {
      navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
    } else if (actualUser?.role === USER_ROLES.TRAINER) {
      navigate(ROUTES.TRAINER_DASHBOARD, { replace: true });
    } else {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          جاري التوجيه للصفحة المناسبة...
        </p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div
            className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
            dir="rtl"
          >
            <Routes>
              {/* Auth Routes */}
              <Route path="/auth" element={<AuthLayout />}>
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route index element={<Navigate to="login" replace />} />
              </Route>

              {/* Protected Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                {/* Student Routes */}
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="daily-words" element={<DailyWordsPage />} />
                <Route path="chat-with-ai" element={<ChatWithAIPage />} />
                <Route path="stories" element={<StoriesPage />} />
                <Route path="story-reader" element={<StoryReaderPage />} />
                <Route path="story-exam" element={<StoryExamPage />} />
                <Route path="stories/daily" element={<StoryReaderPage />} />
                <Route path="stories/:storyId" element={<StoryReaderPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="achievements" element={<AchievementsPage />} />
                <Route
                  path="achievements-admin"
                  element={<AchievementsAdminPage />}
                />

                {/* Admin Routes */}
                <Route
                  path="admin"
                  element={
                    <RoleBasedRoute allowedRoles={["ADMIN"]}>
                      <AdminDashboard />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="admin/overview"
                  element={
                    <RoleBasedRoute allowedRoles={["ADMIN"]}>
                      <AdminOverviewPage />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="admin/users"
                  element={
                    <RoleBasedRoute allowedRoles={["ADMIN"]}>
                      <AdminUsersPage />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="admin/content"
                  element={
                    <RoleBasedRoute allowedRoles={["ADMIN"]}>
                      <AdminContentPage />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="admin/achievements"
                  element={
                    <RoleBasedRoute allowedRoles={["ADMIN"]}>
                      <AchievementsAdminPage />
                    </RoleBasedRoute>
                  }
                />

                {/* Trainer Routes */}
                <Route
                  path="trainer/*"
                  element={
                    <RoleBasedRoute allowedRoles={["TRAINER"]}>
                      <TrainerDashboard />
                    </RoleBasedRoute>
                  }
                />

                {/* Default redirect - redirect based on user role */}
                <Route index element={<Navigate to="/home" replace />} />
                <Route
                  path="home"
                  element={
                    <ProtectedRoute>
                      <HomeRedirect />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/auth/login" replace />} />
            </Routes>

            {/* Global Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "var(--toast-bg)",
                  color: "var(--toast-color)",
                  direction: "rtl",
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
