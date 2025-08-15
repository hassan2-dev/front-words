/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { apiClient } from "../utils/api";
import { API_ENDPOINTS } from "../config/api";
import { STORAGE_KEYS, USER_ROLES } from "../constants/app";
import type { User, AuthState, LoginCredentials, RegisterData } from "../types";

// Auth Context Type
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshAuth: () => Promise<void>;
  silentRefreshAuth: () => Promise<void>;
}

// Auth Actions
type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "UPDATE_USER"; payload: Partial<User> };

// Initial State
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case "AUTH_LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };

    default:
      return state;
  }
};

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Login Function
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      dispatch({ type: "AUTH_START" });

      const response = await apiClient.post(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      if (
        response.success &&
        response.data &&
        typeof response.data === "object" &&
        "user" in response.data &&
        "token" in response.data
      ) {
        const user = (response.data as any).user;
        const token = (response.data as any).token;
        const refreshToken = (response.data as any).refreshToken;

        // Store tokens
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        if (refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }

        // Store user data - ensure it's stored as a direct user object, not nested
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

        dispatch({ type: "AUTH_SUCCESS", payload: user });
        return true;
      } else {
        dispatch({
          type: "AUTH_FAILURE",
          payload: response.error || "فشل في تسجيل الدخول",
        });
        return false;
      }
    } catch (error) {
      dispatch({ type: "AUTH_FAILURE", payload: "حدث خطأ أثناء تسجيل الدخول" });
      return false;
    }
  };

  // Register Function
  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      dispatch({ type: "AUTH_START" });

      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data);

      if (
        response.success &&
        response.data &&
        typeof response.data === "object" &&
        "user" in response.data &&
        "token" in response.data
      ) {
        const user = (response.data as any).user;
        const token = (response.data as any).token;
        const refreshToken = (response.data as any).refreshToken;

        // Store tokens
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        if (refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }

        // Store user data - ensure it's stored as a direct user object, not nested
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

        dispatch({ type: "AUTH_SUCCESS", payload: user });
        return true;
      } else {
        dispatch({
          type: "AUTH_FAILURE",
          payload: response.error || "فشل في التسجيل",
        });
        return false;
      }
    } catch (error) {
      dispatch({ type: "AUTH_FAILURE", payload: "حدث خطأ أثناء التسجيل" });
      return false;
    }
  };

  // Logout Function
  const logout = async (): Promise<void> => {
    try {
      // Note: No logout endpoint defined in API_ENDPOINTS
      // You can add a logout endpoint to the API if needed
      // await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear storage
      localStorage.clear();

      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  // Update User Function
  const updateUser = (userData: Partial<User>): void => {
    dispatch({ type: "UPDATE_USER", payload: userData });

    // Update local storage
    if (state.user) {
      const updatedUser = { ...state.user, ...userData };
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
    }
  };

  // Refresh Auth Function
  const refreshAuth = async (): Promise<void> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);

      if (response.success && response.data) {
        const user = response.data as User;
        dispatch({ type: "AUTH_SUCCESS", payload: user });
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      } else {
        // إذا السيرفر رجع رفض مصادقة
        throw new Error("UNAUTHORIZED");
      }
    } catch (error: any) {
      // إذا الخطأ بسبب رفض المصادقة (401 أو 403) فقط، سجل خروج
      if (
        error?.response?.status === 401 ||
        error?.response?.status === 403 ||
        error?.message === "UNAUTHORIZED"
      ) {
        // لا تسجل خروج تلقائياً، فقط أظهر رسالة
        // يمكنك هنا إظهار رسالة للمستخدم
      } else {
        // إذا كان خطأ شبكة أو أي خطأ آخر، لا تفعل شيئاً
       
      }
    }
  };

  // Silent Refresh Auth Function (for background validation)
  const silentRefreshAuth = async (): Promise<void> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
      if (response.success && response.data) {
        const user = response.data as User;
        dispatch({ type: "AUTH_SUCCESS", payload: user });
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      }
    } catch (error) {
      // لا تفعل شيئاً في حالة الخطأ
    }
  };

  // Initialize Auth on App Start
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);

      if (token && userData) {
        try {
          const parsedData = JSON.parse(userData);
          // Handle both formats: direct user object or {user: {...}}
          const user = parsedData.user || parsedData;

          // Ensure user has required fields
          if (user && user.id && user.role) {
            dispatch({ type: "AUTH_SUCCESS", payload: user });

            // تحقق من صلاحية التوكن في الخلفية بدون إظهار أخطاء
            silentRefreshAuth();
          } else {
            throw new Error("Invalid user data");
          }
        } catch (error) {
          console.error("Error initializing auth:", error);
          // Clear invalid data
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER_DATA);
          dispatch({ type: "AUTH_FAILURE", payload: "" });
        }
      } else {
        dispatch({ type: "AUTH_FAILURE", payload: "" });
      }
    };

    initializeAuth();
  }, []);

  // Context Value
  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    refreshAuth,
    silentRefreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom Hook to use Auth Context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
