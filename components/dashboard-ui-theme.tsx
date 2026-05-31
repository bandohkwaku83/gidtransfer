"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "gidostorage_admin_dark_v1";

type DashboardUiThemeContextValue = {
  darkUi: boolean;
  setDarkUi: (value: boolean) => void;
  toggleDarkUi: () => void;
};

const DashboardUiThemeContext = createContext<DashboardUiThemeContextValue | null>(
  null,
);

export function DashboardUiThemeProvider({ children }: { children: ReactNode }) {
  const [darkUi, setDarkUiState] = useState(false);

  useEffect(() => {
    try {
      setDarkUiState(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDarkUiState(false);
    }
  }, []);

  const setDarkUi = useCallback((value: boolean) => {
    setDarkUiState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const toggleDarkUi = useCallback(() => {
    setDarkUi(!darkUi);
  }, [darkUi, setDarkUi]);

  return (
    <DashboardUiThemeContext.Provider value={{ darkUi, setDarkUi, toggleDarkUi }}>
      {children}
    </DashboardUiThemeContext.Provider>
  );
}

export function useDashboardUiTheme(): DashboardUiThemeContextValue {
  const ctx = useContext(DashboardUiThemeContext);
  if (!ctx) {
    throw new Error("useDashboardUiTheme must be used within DashboardUiThemeProvider");
  }
  return ctx;
}
