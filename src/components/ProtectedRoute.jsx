import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AppSkeleton from "./AppSkeleton";
import {
  getCurrentSession,
  subscribeOfflineAuthChange,
} from "../lib/offlineAuth";

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const loadSession = async () => {
      setError("");
      try {
        setSession(await getCurrentSession());
      } catch (requestError) {
        setError(requestError.message || "Проверьте подключение и настройки Supabase.");
        setSession(undefined);
      }
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(loadSession);
    const unsubscribeOffline = subscribeOfflineAuthChange(loadSession);

    return () => {
      listener.subscription.unsubscribe();
      unsubscribeOffline();
    };
  }, [retryKey]);

  if (session === undefined) {
    return (
      <AppSkeleton
        error={error}
        message="Проверяем вход и готовим приложение"
        onRetry={error ? () => setRetryKey((key) => key + 1) : undefined}
      />
    );
  }
  if (!session) return <Navigate to="/login" replace />;

  return children;
}
