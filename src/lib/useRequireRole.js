'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { dashboardPath, loginPath } from '@/lib/routes';

export function useRequireRole(requiredRole) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) {
      router.replace(loginPath(requiredRole));
      return;
    }
    if (auth.role && auth.role !== requiredRole) {
      router.replace(dashboardPath(auth.role));
    }
  }, [auth.loading, auth.user, auth.role, requiredRole, router]);

  return {
    ...auth,
    ready: !auth.loading && !!auth.user && auth.role === requiredRole,
  };
}
