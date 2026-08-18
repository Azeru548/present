'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserData, getUserDataWithRetry } from '@/lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('@/lib/face')
      .then(({ loadModels }) => loadModels())
      .catch(() => {});

    if (!auth) {
      setLoading(false);
      return undefined;
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Stay in the loading state until the Firestore profile is resolved.
      // Otherwise pages see `user` with `role === null` and bounce
      // login <-> dashboard in a loop.
      setLoading(true);
      try {
        if (!firebaseUser) {
          setUser(null);
          setRole(null);
          setUserData(null);
          return;
        }
        setUser(firebaseUser);
        const data = await getUserDataWithRetry(firebaseUser.uid);
        if (data?.role) {
          setUserData(data);
          setRole(data.role);
        }
        // If the profile is still missing, do not overwrite a role that
        // register/login just wrote via refreshUserData.
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!auth?.currentUser) return;
    const d = await getUserDataWithRetry(auth.currentUser.uid);
    setUserData(d);
    setRole(d?.role || null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, role, userData, loading, refreshUserData }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
