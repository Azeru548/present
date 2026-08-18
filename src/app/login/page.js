'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { dashboardPath } from '@/lib/routes';
import Loading from '@/components/Loading';
import Icon from '@/components/Icon';

export default function LoginChooser() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user || !role) return;
    router.replace(dashboardPath(role));
  }, [user, role, loading, router]);

  if (loading) return <Loading text="Checking session..." />;
  if (user && role) return <Loading text="Redirecting..." />;

  return (
    <div className="container">
      <div className="card authCard animate-pop">
        <div className="auth-icon" aria-hidden="true">
          <Icon name="lock" size={22} />
        </div>
        <h1 className="page-title">Sign In</h1>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--ink-2)',
            marginBottom: 20,
            fontSize: '0.9rem',
          }}
        >
          Choose how you want to sign in to Present.
        </p>

        <Link
          href="/login/student"
          className="oauth-btn"
          style={{ marginBottom: 12, textDecoration: 'none' }}
        >
          <Icon name="student" size={18} />
          I&rsquo;m a Student
        </Link>

        <Link
          href="/login/lecturer"
          className="oauth-btn"
          style={{ textDecoration: 'none' }}
        >
          <Icon name="lecturer" size={18} />
          I&rsquo;m a Lecturer
        </Link>

        <p className="auth-footer">
          No account? <Link href="/register/student">Register here</Link>
        </p>
      </div>
    </div>
  );
}