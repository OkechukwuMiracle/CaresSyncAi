import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useSupabase } from "./SupabaseContext";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { supabase } = useSupabase();
  const [user, setUser] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch clinic data using Supabase JWT (wrapped in useCallback)
  const fetchClinicData = useCallback(
    async (email) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) return;

        const response = await fetch(
          `${
            process.env.REACT_APP_API_URL || "http://localhost:5000"
          }/api/auth/profile`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setClinic(data.clinic);
        } else {
          console.error("Failed to fetch clinic data");
        }
      } catch (error) {
        console.error("Error fetching clinic data:", error);
      }
    },
    [supabase]
  );

  // 🔹 Load session & listen for auth changes
  useEffect(() => {
    const initSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          await fetchClinicData(session.user.email);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchClinicData(session.user.email);
        } else {
          setUser(null);
          setClinic(null);
        }
        setLoading(false);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [supabase, fetchClinicData]);

  // 🔹 Register new clinic (keeps backend route)
  const signUp = async (email, password, clinicData) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:5000"
        }/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, ...clinicData }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Registration successful! Please verify your email.");
        return { success: true, data };
      } else {
        toast.error(data.error || "Registration failed");
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error("Registration failed. Please try again.");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Sign in directly with Supabase Auth
  const signIn = async (email, password) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error: error.message };
      }

      setUser(data.user);
      await fetchClinicData(data.user.email);

      toast.success("Login successful!");
      return { success: true };
    } catch (err) {
      console.error("Sign in error:", err);
      toast.error("Login failed. Please try again.");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Sign out (Supabase handles it)
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setUser(null);
      setClinic(null);
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Logout failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Reset password via backend helper route
  const resetPassword = async (email) => {
    try {
      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:5000"
        }/api/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Password reset email sent!");
        return { success: true };
      } else {
        toast.error(data.error || "Failed to send reset email");
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Failed to send reset email. Please try again.");
      return { success: false, error: error.message };
    }
  };

  // 🔹 Update clinic profile
  const updateProfile = async (profileData) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:5000"
        }/api/auth/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(profileData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setClinic(data.clinic);
        toast.success("Profile updated successfully!");
        return { success: true, data };
      } else {
        toast.error(data.error || "Failed to update profile");
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("Failed to update profile.");
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    clinic,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    fetchClinicData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
