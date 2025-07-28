import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { STORAGE_KEYS, THEMES } from "../constants/app";
import type { ThemeContextType } from "../types";

// Create Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme Provider Props
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme Provider Component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check for saved preference
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme) {
      return savedTheme === THEMES.DARK;
    }

    // Check system preference if no saved preference
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    return false;
  });

  // Toggle theme function
  const toggleTheme = (): void => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      localStorage.setItem(
        STORAGE_KEYS.THEME,
        newTheme ? THEMES.DARK : THEMES.LIGHT
      );
      return newTheme;
    });
  };

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Update CSS custom properties for better theme support
    const style = root.style;
    if (isDarkMode) {
      style.setProperty("--toast-bg", "#374151");
      style.setProperty("--toast-color", "#F9FAFB");
    } else {
      style.setProperty("--toast-bg", "#FFFFFF");
      style.setProperty("--toast-color", "#111827");
    }
  }, [isDarkMode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      // Only update if no manual preference is saved
      if (!savedTheme) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Context value
  const value: ThemeContextType = {
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
