"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useElectronStore } from "@/hooks/use-electron";
import {
  DEFAULT_THEME,
  type Theme,
  THEME_STORAGE_KEY,
} from "@/lib/theme/constants";

type ResolvedTheme = "dark" | "light";

interface ThemeContextValue {
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = RequiredChildren;

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");
  const [isLoaded, setIsLoaded] = useState(false);
  const { get, set } = useElectronStore();

  // Determine the resolved theme based on the current theme setting
  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    if (theme === "system") {
      return systemTheme;
    }
    return theme;
  }, [theme, systemTheme]);

  // Apply the theme class to the HTML element
  useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    // Apply the appropriate class based on theme setting
    if (theme !== "system") {
      root.classList.add(theme);
    }
    // When theme is "system", no class is added, allowing CSS media query to take effect
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryList | MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    // Set initial system theme
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Load saved theme from electron-store on mount
  useEffect(() => {
    async function loadTheme() {
      const savedTheme = await get<Theme>(THEME_STORAGE_KEY);
      if (savedTheme && ["dark", "light", "system"].includes(savedTheme)) {
        setThemeState(savedTheme);
      }
      setIsLoaded(true);
    }
    loadTheme();
  }, [get]);

  // Persist theme changes to electron-store
  const setTheme = useCallback(
    async (newTheme: Theme) => {
      setThemeState(newTheme);
      await set(THEME_STORAGE_KEY, newTheme);
    },
    [set]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      resolvedTheme,
      setTheme,
      theme,
    }),
    [resolvedTheme, setTheme, theme]
  );

  // Prevent flash of wrong theme by not rendering until loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
