import React, { createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// 🟢 Create the Supabase client once (singleton)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "🚨 Missing environment variables: REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY"
  );
  console.warn(
    "Make sure your .env file is in the project root and prefixed with REACT_APP_. Then restart your dev server."
  );
}

console.log("🔍 Supabase URL:", supabaseUrl);
console.log(
  "🔍 Supabase Key:",
  supabaseAnonKey ? supabaseAnonKey.slice(0, 12) + "..." : "undefined"
);

const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

const SupabaseContext = createContext();

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
};

export const SupabaseProvider = ({ children }) => (
  <SupabaseContext.Provider value={{ supabase }}>
    {children}
  </SupabaseContext.Provider>
);
