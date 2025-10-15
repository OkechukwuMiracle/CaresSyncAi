import React, { createContext, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://phoumeccawrtsjztxldi.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBob3VtZWNjYXdydHNqenR4bGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDEyNTcsImV4cCI6MjA3NTkxNzI1N30.xMGO_scepJgrqhF318DZuXQwuVcZR47AMS81wFwcQA0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SupabaseContext = createContext();

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

export const SupabaseProvider = ({ children }) => {
  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
};
