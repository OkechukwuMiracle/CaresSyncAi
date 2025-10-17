// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   useCallback,
// } from "react";
// import { useSupabase } from "./SupabaseContext";
// import toast from "react-hot-toast";

// const AuthContext = createContext();

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error("useAuth must be used within an AuthProvider");
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const { supabase } = useSupabase();
//   const [user, setUser] = useState(null);
//   const [clinic, setClinic] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // 🔹 Fetch clinic data (backend JWT auth)
//   const fetchClinicData = useCallback(
//     async (email) => {
//       try {
//         const { data, error } = await supabase.auth.getSession();
//         if (error) {
//           console.error("❌ Supabase session fetch error:", error);
//           return;
//         }

//         const session = data?.session;
//         if (!session?.access_token) {
//           console.warn("⚠️ No Supabase access token found");
//           return;
//         }

//         console.log("📡 Fetching clinic data from backend...");

//         const response = await fetch(
//           `${
//             process.env.REACT_APP_API_URL || "http://localhost:5000"
//           }/api/auth/profile`,
//           {
//             headers: {
//               Authorization: `Bearer ${session.access_token}`,
//             },
//           }
//         );

//         if (response.ok) {
//           const data = await response.json();
//           console.log("✅ Clinic data loaded:", data);
//           setClinic(data.clinic);
//         } else {
//           const err = await response.text();
//           console.error("❌ Failed to fetch clinic data:", err);
//         }
//       } catch (error) {
//         console.error("🔥 Error fetching clinic data:", error);
//       }
//     },
//     [supabase]
//   );

//   // 🔹 Initialize session
//   useEffect(() => {
//     const initSession = async () => {
//       console.log("🟡 Initializing Supabase session...");
//       try {
//         const { data, error } = await supabase.auth.getSession();
//         if (error) {
//           console.error("❌ Supabase getSession error:", error);
//           setLoading(false);
//           return;
//         }

//         const session = data?.session;
//         if (session?.user) {
//           console.log("✅ Active user found:", session.user.email);
//           setUser(session.user);
//           await fetchClinicData(session.user.email);
//         } else {
//           console.log("ℹ️ No user session found");
//           setUser(null);
//         }
//       } catch (error) {
//         console.error("🔥 Error during session init:", error);
//       } finally {
//         setLoading(false);
//         console.log("✅ Finished session init, loading=false");
//       }
//     };

//     initSession();

//     const { data: listener } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         console.log("🔄 Auth state changed:", event);
//         if (session?.user) {
//           console.log("🔑 User logged in:", session.user.email);
//           setUser(session.user);
//           await fetchClinicData(session.user.email);
//         } else {
//           console.log("🚪 User logged out");
//           setUser(null);
//           setClinic(null);
//         }
//       }
//     );

//     return () => {
//       console.log("🧹 Cleaning up Supabase auth listener");
//       listener.subscription.unsubscribe();
//     };
//   }, [supabase, fetchClinicData]);

//   // 🔹 Auth Actions
//   const signUp = async (email, password, clinicData) => {
//     try {
//       setLoading(true);
//       const response = await fetch(
//         `${
//           process.env.REACT_APP_API_URL || "http://localhost:5000"
//         }/api/auth/register`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ email, password, ...clinicData }),
//         }
//       );

//       const data = await response.json();
//       if (response.ok) {
//         toast.success("Registration successful! Please verify your email.");
//         return { success: true, data };
//       } else {
//         toast.error(data.error || "Registration failed");
//         return { success: false, error: data.error };
//       }
//     } catch (error) {
//       console.error("❌ Sign-up error:", error);
//       toast.error("Registration failed. Please try again.");
//       return { success: false, error: error.message };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const signIn = async (email, password) => {
//     try {
//       setLoading(true);
//       const { data, error } = await supabase.auth.signInWithPassword({
//         email,
//         password,
//       });

//       if (error) {
//         toast.error(error.message);
//         return { success: false, error: error.message };
//       }

//       console.log("✅ Login successful:", data.user);
//       setUser(data.user);
//       await fetchClinicData(data.user.email);
//       toast.success("Login successful!");
//       return { success: true };
//     } catch (err) {
//       console.error("❌ Sign-in error:", err);
//       toast.error("Login failed. Please try again.");
//       return { success: false, error: err.message };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const signOut = async () => {
//     try {
//       setLoading(true);
//       const { error } = await supabase.auth.signOut();
//       if (error) throw error;
//       setUser(null);
//       setClinic(null);
//       toast.success("Logged out successfully");
//     } catch (error) {
//       console.error("❌ Sign-out error:", error);
//       toast.error("Logout failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const value = {
//     user,
//     clinic,
//     loading,
//     signUp,
//     signIn,
//     signOut,
//     fetchClinicData,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };






// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   useCallback,
//   useRef,
// } from "react";
// import { useSupabase } from "./SupabaseContext";
// import toast from "react-hot-toast";

// const AuthContext = createContext();

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error("useAuth must be used within an AuthProvider");
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const { supabase } = useSupabase();
//   const [user, setUser] = useState(null);
//   const [clinic, setClinic] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [initializing, setInitializing] = useState(true);
//   const isMounted = useRef(true);

//   // 🔹 Fetch clinic data (backend JWT auth)
//   const fetchClinicData = useCallback(
//     async (email) => {
//       if (!isMounted.current) return;
      
//       try {
//         const { data, error } = await supabase.auth.getSession();
//         if (error) {
//           console.error("❌ Supabase session fetch error:", error);
//           return;
//         }

//         const session = data?.session;
//         if (!session?.access_token) {
//           console.warn("⚠️ No Supabase access token found");
//           return;
//         }

//         console.log("📡 Fetching clinic data from backend...");

//         const response = await fetch(
//           `${
//             process.env.REACT_APP_API_URL || "http://localhost:5000"
//           }/api/auth/profile`,
//           {
//             headers: {
//               Authorization: `Bearer ${session.access_token}`,
//             },
//           }
//         );

//         if (response.ok && isMounted.current) {
//           const data = await response.json();
//           console.log("✅ Clinic data loaded:", data);
//           setClinic(data.clinic);
//         } else if (!response.ok) {
//           const err = await response.text();
//           console.error("❌ Failed to fetch clinic data:", err);
//         }
//       } catch (error) {
//         console.error("🔥 Error fetching clinic data:", error);
//       }
//     },
//     [supabase]
//   );

//   // 🔹 Initialize session
//   useEffect(() => {
//     let authListener = null;
//     isMounted.current = true;

//     const initSession = async () => {
//       console.log("🟡 Initializing Supabase session...");
//       try {
//         const { data, error } = await supabase.auth.getSession();
        
//         if (!isMounted.current) return;
        
//         if (error) {
//           console.error("❌ Supabase getSession error:", error);
//           setLoading(false);
//           setInitializing(false);
//           return;
//         }

//         const session = data?.session;
//         if (session?.user) {
//           console.log("✅ Active user found:", session.user.email);
//           setUser(session.user);
//           await fetchClinicData(session.user.email);
//         } else {
//           console.log("ℹ️ No user session found");
//           setUser(null);
//         }
//       } catch (error) {
//         console.error("🔥 Error during session init:", error);
//       } finally {
//         if (isMounted.current) {
//           setLoading(false);
//           setInitializing(false);
//           console.log("✅ Finished session init, loading=false");
//         }
//       }
//     };

//     initSession();

//     // Set up auth listener
//     const { data: listener } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         if (!isMounted.current) return;
        
//         console.log("🔄 Auth state changed:", event);
        
//         // Skip INITIAL_SESSION event since we handle it in initSession
//         if (event === 'INITIAL_SESSION') {
//           return;
//         }
        
//         if (session?.user) {
//           console.log("🔑 User logged in:", session.user.email);
//           setUser(session.user);
//           await fetchClinicData(session.user.email);
//         } else {
//           console.log("🚪 User logged out");
//           setUser(null);
//           setClinic(null);
//         }
        
//         // Ensure loading is false after any auth state change
//         if (initializing) {
//           setLoading(false);
//           setInitializing(false);
//         }
//       }
//     );

//     authListener = listener;

//     return () => {
//       console.log("🧹 Cleaning up Supabase auth listener");
//       isMounted.current = false;
//       if (authListener?.subscription) {
//         authListener.subscription.unsubscribe();
//       }
//     };
//   }, [supabase, fetchClinicData, initializing]);

//   // 🔹 Auth Actions
//   const signUp = async (email, password, clinicData) => {
//     try {
//       const response = await fetch(
//         `${
//           process.env.REACT_APP_API_URL || "http://localhost:5000"
//         }/api/auth/register`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ email, password, ...clinicData }),
//         }
//       );

//       const data = await response.json();
//       if (response.ok) {
//         toast.success("Registration successful! Please verify your email.");
//         return { success: true, data };
//       } else {
//         toast.error(data.error || "Registration failed");
//         return { success: false, error: data.error };
//       }
//     } catch (error) {
//       console.error("❌ Sign-up error:", error);
//       toast.error("Registration failed. Please try again.");
//       return { success: false, error: error.message };
//     }
//   };

//   const signIn = async (email, password) => {
//     try {
//       setLoading(true);
//       const { data, error } = await supabase.auth.signInWithPassword({
//         email,
//         password,
//       });

//       if (error) {
//         toast.error(error.message);
//         setLoading(false);
//         return { success: false, error: error.message };
//       }

//       console.log("✅ Login successful:", data.user);
//       setUser(data.user);
//       await fetchClinicData(data.user.email);
//       toast.success("Login successful!");
//       setLoading(false);
//       return { success: true };
//     } catch (err) {
//       console.error("❌ Sign-in error:", err);
//       toast.error("Login failed. Please try again.");
//       setLoading(false);
//       return { success: false, error: err.message };
//     }
//   };

//   const signOut = async () => {
//     try {
//       setLoading(true);
//       const { error } = await supabase.auth.signOut();
//       if (error) throw error;
//       setUser(null);
//       setClinic(null);
//       toast.success("Logged out successfully");
//       setLoading(false);
//     } catch (error) {
//       console.error("❌ Sign-out error:", error);
//       toast.error("Logout failed");
//       setLoading(false);
//     }
//   };

//   const value = {
//     user,
//     clinic,
//     loading,
//     signUp,
//     signIn,
//     signOut,
//     fetchClinicData,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };




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
  const initialized = useRef(false);

  console.log("🔵 AuthProvider render - loading:", loading, "user:", user?.email);

  // 🔹 Fetch clinic data (backend JWT auth)
  const fetchClinicData = useCallback(
    async (userEmail) => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("❌ Supabase session fetch error:", error);
          return;
        }

        const session = data?.session;
        if (!session?.access_token) {
          console.warn("⚠️ No Supabase access token found");
          return;
        }

        console.log("📡 Fetching clinic data from backend...");

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
          console.log("✅ Clinic data loaded:", data);
          setClinic(data.clinic);
        } else {
          const err = await response.text();
          console.error("❌ Failed to fetch clinic data:", err);
        }
      } catch (error) {
        console.error("🔥 Error fetching clinic data:", error);
      }
    },
    [supabase]
  );

  // 🔹 Initialize session
//   // 🔹 Initialize session
// useEffect(() => {
//   let mounted = true;
  
//   const initSession = async () => {
//     if (initialized.current) {
//       console.log("⏭️ Already initialized, skipping");
//       if (mounted) setLoading(false); // Ensure loading is false on re-renders
//       return;
//     }

//     console.log("🟡 Initializing Supabase session...");
//     initialized.current = true;

//     try {
//       // Try to get session with retry logic
//       const { data, error } = await supabase.auth.getSession();
      
//       if (!mounted) {
//         console.log("⚠️ Component unmounted, aborting");
//         return;
//       }
      
//       if (error) {
//         console.warn("⚠️ Supabase getSession error (non-fatal):", error.message);
//         // Don't fail loading state on network errors - auth listener will handle
//       } else if (data?.session?.user) {
//         console.log("✅ Active user found:", data.session.user.email);
//         setUser(data.session.user);
//         await fetchClinicData(data.session.user.email);
//       } else {
//         console.log("ℹ️ No user session found");
//         setUser(null);
//         setClinic(null);
//       }
//     } catch (error) {
//       console.error("🔥 Error during session init:", error);
//       // Don't fail loading state on network errors
//     } finally {
//       if (mounted) {
//         console.log("✅ Initial loading complete, setting loading to FALSE");
//         setLoading(false); // Always set loading false after init attempt
//       }
//     }
//   };

//   initSession();

//   // Set up auth listener with improved error handling
//   const { data: authListener } = supabase.auth.onAuthStateChange(
//     async (event, session) => {
//       if (!mounted) return;
      
//       console.log("🔄 Auth state changed:", event);
      
//       try {
//         switch (event) {
//           case 'SIGNED_IN':
//             if (session?.user) {
//               console.log("🔑 User logged in:", session.user.email);
//               setUser(session.user);
//               // Ensure loading is false when user is authenticated
//               setLoading(false);
//               await fetchClinicData(session.user.email);
//             }
//             break;
            
//           case 'SIGNED_OUT':
//             console.log("🚪 User logged out");
//             setUser(null);
//             setClinic(null);
//             setLoading(false); // Ensure loading is false after logout
//             break;
            
//           case 'TOKEN_REFRESHED':
//             console.log("🔄 Token refreshed");
//             // Update user if session exists
//             if (session?.user) {
//               setUser(session.user);
//             }
//             break;
            
//           case 'USER_UPDATED':
//             if (session?.user) {
//               setUser(session.user);
//             }
//             break;
            
//           default:
//             console.log("ℹ️ Auth event:", event);
//         }
//       } catch (error) {
//         console.error("❌ Auth listener error:", error);
//         // Ensure loading state is resolved even on listener errors
//         setLoading(false);
//       }
//     }
//   );

//   // Cleanup function
//   return () => {
//     console.log("🧹 Cleaning up auth listener");
//     mounted = false;
//     authListener?.subscription?.unsubscribe();
//   };
// }, [supabase, fetchClinicData]);


// 🔹 Initialize session - Fixed for StrictMode
useEffect(() => {
  // Use ref to track real initialization (ignores StrictMode double-mount)
  if (initialized.current) {
    console.log("⏭️ Already initialized, skipping");
    setLoading(false);
    return;
  }

  let mounted = true;
  let authListenerCleanup;

  const initSession = async () => {
    console.log("🟡 Initializing Supabase session...");
    initialized.current = true;

    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (!mounted) {
        console.log("⚠️ Component unmounted during init");
        return;
      }
      
      if (error) {
        console.warn("⚠️ Supabase getSession error:", error.message);
      } else if (data?.session?.user) {
        console.log("✅ Active user found:", data.session.user.email);
        setUser(data.session.user);
        await fetchClinicData(data.session.user.email);
      } else {
        console.log("ℹ️ No user session found");
        setUser(null);
        setClinic(null);
      }
    } catch (error) {
      console.error("🔥 Error during session init:", error);
    } finally {
      if (mounted) {
        console.log("✅ Initial loading complete");
        setLoading(false);
      }
    }
  };

  initSession();

  // Auth state listener
  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (!mounted) return;
      
      console.log("🔄 Auth state changed:", event);
      
      try {
        switch (event) {
          case 'INITIAL_SESSION':
            // Handle initial session from listener
            if (session?.user) {
              setUser(session.user);
              await fetchClinicData(session.user.email);
            }
            setLoading(false);
            break;
            
          case 'SIGNED_IN':
            if (session?.user) {
              console.log("🔑 User logged in:", session.user.email);
              setUser(session.user);
              setLoading(false);
              await fetchClinicData(session.user.email);
            }
            break;
            
          case 'SIGNED_OUT':
            console.log("🚪 User logged out");
            setUser(null);
            setClinic(null);
            setLoading(false);
            break;
            
          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            if (session?.user) {
              setUser(session.user);
            }
            break;

            default:
            console.log("ℹ️ Auth event:", event);
        }
      } catch (error) {
        console.error("❌ Auth listener error:", error);
        setLoading(false);
      }
    }
  );

  // Store cleanup function
  authListenerCleanup = () => {
    console.log("🧹 Cleaning up auth listener");
    authListener.subscription?.unsubscribe();
  };

  // Cleanup on unmount
  return () => {
    mounted = false;
    if (authListenerCleanup) {
      authListenerCleanup();
    }
  };
}, [supabase, fetchClinicData]); // Dependencies won't change after first render

  // 🔹 Auth Actions
  const signUp = async (email, password, clinicData) => {
    try {
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
      console.error("❌ Sign-up error:", error);
      toast.error("Registration failed. Please try again.");
      return { success: false, error: error.message };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error: error.message };
      }

      console.log("✅ Login successful:", data.user);
      toast.success("Login successful!");
      return { success: true };
    } catch (err) {
      console.error("❌ Sign-in error:", err);
      toast.error("Login failed. Please try again.");
      return { success: false, error: err.message };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("❌ Sign-out error:", error);
      toast.error("Logout failed");
    }
  };

  const value = {
    user,
    clinic,
    loading,
    signUp,
    signIn,
    signOut,
    fetchClinicData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};