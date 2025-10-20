"use client";
import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { SupabaseProvider } from '../src/contexts/SupabaseContext';
import { AuthProvider } from '../src/contexts/AuthContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SupabaseProvider>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#363636', color: '#fff' },
          }}
        />
      </AuthProvider>
    </SupabaseProvider>
  );
}
