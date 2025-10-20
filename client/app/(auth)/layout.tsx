"use client";
import { ReactNode, useEffect } from "react";
import { useAuth } from "../../src/contexts/AuthContext";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../../src/components/common/LoadingSpinner";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect only when loading is finished and user exists
    if (!loading && user) {
      // Use push instead of replace to ensure navigation happens
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  // Wait while loading auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If logged in, don't render children (e.g., login/register)
  if (user) return null;

  // Otherwise show login/register page
  return <>{children}</>;
}
