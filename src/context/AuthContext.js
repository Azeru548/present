'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserRole, getUserData } from '@/lib/auth';

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
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const [r, d] = await Promise.all([
          getUserRole(firebaseUser.uid),
          getUserData(firebaseUser.uid),
        ]);
        setRole(r);
        setUserData(d);
      } else {
        setRole(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshUserData = useCallback(async () => {
    if (auth.currentUser) {
      const d = await getUserData(auth.currentUser.uid);
      setUserData(d);
      setRole(d?.role || null);
    }
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
