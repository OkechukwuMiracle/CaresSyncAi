import React, { createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast and explain clearly in dev logs (dev-only)
  if (process.env.NODE_ENV === "development") {
    console.error(
      "🚨 Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Check client/.env.local and restart the dev server."
    );
  }
}

// Additional runtime checks (dev-only logs)
const __urlLooksValid = !!supabaseUrl && supabaseUrl.startsWith("https://");
const __keyLooksJwt = !!supabaseAnonKey && supabaseAnonKey.split(".").length >= 3;

if (process.env.NODE_ENV === "development") {
  if (supabaseAnonKey && supabaseAnonKey.toLowerCase().includes("service_role")) {
    console.error("Security error: Do NOT use service_role keys in the client!");
  }
  if (supabaseUrl && !__urlLooksValid) {
    console.warn("Supabase URL does not start with https://. Verify NEXT_PUBLIC_SUPABASE_URL.");
  }
  if (supabaseAnonKey && !__keyLooksJwt) {
    console.warn("Supabase anon key does not look like a JWT. Verify NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
const SupabaseValue = { supabase };

const SupabaseContext = createContext();

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
};

// Optional ergonomic helper: get the supabase client directly without breaking existing usage
export const useSupabaseClient = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabaseClient must be used within a SupabaseProvider");
  }
  return context.supabase;
};

export const SupabaseProvider = ({ children }) => {
  if (!supabase) {
    // Render a clear configuration error to avoid silent hangs
    const missing = [];
    if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    const mask = (val) => (typeof val === "string" ? `${val.slice(0, 6)}...${val.slice(-4)}` : "");

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-red-50 border border-red-200 rounded-md p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Configuration error</h2>
          <p className="text-sm text-red-700 mb-3">
            Missing required environment variables. Update client/.env.local and restart the dev server.
          </p>
          <ul className="text-sm text-red-700 list-disc pl-5 space-y-1">
            {!supabaseUrl && <li>REACT_APP_SUPABASE_URL is missing</li>}
            {!supabaseAnonKey && <li>REACT_APP_SUPABASE_ANON_KEY is missing</li>}
          </ul>
          <div className="mt-4 text-xs text-red-700">
            <div>Current values (masked):</div>
            <div>URL: {supabaseUrl ? mask(supabaseUrl) : "(not set)"}</div>
            <div>Anon Key: {supabaseAnonKey ? mask(supabaseAnonKey) : "(not set)"}</div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }
  return (
    <SupabaseContext.Provider value={SupabaseValue}>{children}</SupabaseContext.Provider>
  );
};
