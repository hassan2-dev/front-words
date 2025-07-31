import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
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
import { AdminDashboard } from "./features/admin/pages/AdminDashboard";
import { TrainerDashboard } from "./features/trainer/pages/TrainerDashboard";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import LoginPage from "./features/auth/pages/LoginPage";

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
                  path="admin/*"
                  element={
                    <RoleBasedRoute allowedRoles={["ADMIN"]}>
                      <AdminDashboard />
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

                {/* Default redirect */}
                <Route index element={<Navigate to="dashboard" replace />} />
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
