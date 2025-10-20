// "use client";
// import { ReactNode, useEffect } from 'react';
// import { useAuth } from '../../src/contexts/AuthContext';
// import { useRouter } from 'next/navigation';
// import Layout from '../../src/components/layout/Layout';

// export default function ProtectedLayout({ children }: { children: ReactNode }) {
//   const { user, loading } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!loading && !user) router.replace('/login');
//   }, [loading, user, router]);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">Loading...</div>
//     );
//   }

//   // return <Layout>{children}</Layout>;
//   return <Layout>{user ? children : null}</Layout>;
// }


  "use client";
  import { ReactNode, useEffect } from 'react';
  import { useAuth } from '../../src/contexts/AuthContext';
  import { useRouter } from 'next/navigation';
  import Layout from '../../src/components/layout/Layout';
  import LoadingSpinner from '../../src/components/common/LoadingSpinner';

  export default function ProtectedLayout({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.replace('/login');
      }
    }, [loading, user, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return <Layout>{children}</Layout>;
  }