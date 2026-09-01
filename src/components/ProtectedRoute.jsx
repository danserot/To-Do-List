import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  getCurrentSession,
  subscribeOfflineAuthChange,
} from "../lib/offlineAuth";

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    const loadSession = async () => {
      setSession(await getCurrentSession());
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(loadSession);
    const unsubscribeOffline = subscribeOfflineAuthChange(loadSession);

    return () => {
      listener.subscription.unsubscribe();
      unsubscribeOffline();
    };
  }, []);

  if (session === undefined) return <div className="centered">Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;

  return children;
}
