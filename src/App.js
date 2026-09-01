import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import AppSettings from "./pages/AppSettings";
import ProtectedRoute from "./components/ProtectedRoute";
import {
  getCurrentUser,
  getOfflineProfile,
  subscribeOfflineAuthChange,
} from "./lib/offlineAuth";
import { settingsRepository } from "./services/settingsRepository";
import { applyTheme, subscribeSystemTheme } from "./platform/theme";
import "./styles/App.css";

export default function App() {
  useEffect(() => {
    const loadTheme = async () => {
      const user = await getCurrentUser();
      if (!user) {
        applyTheme("light");
        return;
      }
      applyTheme(settingsRepository.get(user, getOfflineProfile()).theme);
    };

    loadTheme();
    const unsubscribeSettings = settingsRepository.subscribe(loadTheme);
    const unsubscribeAuth = subscribeOfflineAuthChange(loadTheme);
    const unsubscribeSystem = subscribeSystemTheme(loadTheme);
    return () => {
      unsubscribeSettings();
      unsubscribeAuth();
      unsubscribeSystem();
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppSettings />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
