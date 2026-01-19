"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useSupabase } from "./SupabaseContext";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const { supabase } = useSupabase();
  const [user, setUser] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);

  // Track liveness to avoid state updates after unmount
  const aliveRef = useRef(true);

  const devLog = (...args) => {
    if (process.env.NODE_ENV === "development") {
      console.log(...args);
    }
  };

  // Fetch clinic data from the backend using the user's JWT
  const fetchClinicData = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        devLog("⚠️ getSession error:", error);
        return;
      }

      if (!session?.access_token) {
        devLog("⚠️ No Supabase access token found for fetching clinic data.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/profile`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!aliveRef.current) return;

      if (response.ok) {
        const data = await response.json();
        if (!aliveRef.current) return;
        setClinic(data.clinic);
      } else {
        const err = await response.text();
        console.error("❌ Failed to fetch clinic data:", err);
        if (!aliveRef.current) return;
        setClinic(null);
      }
    } catch (error) {
      console.error("🔥 Error fetching clinic data:", error);
      if (!aliveRef.current) return;
      setClinic(null);
    }
  }, [supabase]);

  // Initialize session and subscribe to auth changes
  useEffect(() => {
    aliveRef.current = true;
    setLoading(true);

    const init = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          devLog("⚠️ getSession error:", error);
        }
        if (!aliveRef.current) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchClinicData();
        } else {
          setClinic(null);
        }
      } catch (e) {
        console.error("🔥 Error during session init:", e);
      }
    };

    init();

    // Fallback: ensure loading resolves even if no auth event arrives promptly
    const safetyTimer = setTimeout(() => {
      if (aliveRef.current) setLoading(false);
    }, 1500);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      devLog("🔄 Auth state changed:", event);
      if (!aliveRef.current) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      switch (event) {
        case "SIGNED_IN":
        case "INITIAL_SESSION":
        case "TOKEN_REFRESHED":
        case "USER_UPDATED":
          if (currentUser) {
            // Fetch clinic data OUTSIDE the callback to avoid deadlock
            fetchClinicData();
          }
          break;
        case "SIGNED_OUT":
          setClinic(null);
          break;
        default:
          break;
      }

      // Always resolve loading after any auth event
      setLoading(false);
      clearTimeout(safetyTimer);
    });

    return () => {
      devLog("🧹 Cleaning up auth listener");
      aliveRef.current = false;
      clearTimeout(safetyTimer);
      subscription?.unsubscribe?.();
    };
  }, [supabase, fetchClinicData]);

  // Auth Actions
  const signUp = async (email, password, clinicData) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, ...clinicData }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success("Registration successful! Redirecting to login...");
        return { success: true, data };
      } else {
        const errorMessage = data.error || "Registration failed";
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error("❌ Sign-up error:", error);
      const errorMessage = "Registration failed. Please check your connection and try again.";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const errorMessage = error.message === "Invalid login credentials" 
          ? "Invalid email or password" 
          : error.message;
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }

      toast.success("Login successful! Redirecting...");
      // The onAuthStateChange listener will handle user and clinic data fetching
      return { success: true };
    } catch (error) {
      console.error("❌ Sign-in error:", error);
      const errorMessage = "Login failed. Please try again.";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Logout failed");
        console.error("❌ Sign-out error:", error);
        return { success: false };
      }
      toast.success("Logged out successfully");
      // The onAuthStateChange listener will handle state cleanup
      return { success: true };
    } catch (error) {
      console.error("❌ Sign-out error:", error);
      toast.error("Logout failed");
      return { success: false };
    }
  };

  const value = {
    user,
    clinic,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};