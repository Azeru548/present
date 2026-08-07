'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { login, signInWithGoogle, getUserData } from '@/lib/auth';
import { friendlyError } from '@/lib/errors';
import Loading from '@/components/Loading';
import Icon from '@/components/Icon';

export default function StudentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard/student');
    }
  }, [user, role, loading, router]);

  if (loading) return <Loading text="Checking session..." />;
  if (user) return <Loading text="Redirecting..." />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      const data = await getUserData(user.uid);
      if (data?.role !== 'student') {
        setError('This account is not registered as a student.');
        return;
      }
      router.push('/dashboard/student');
    } catch (err) {
      setError(friendlyError(err, 'Unable to sign in. Please try again.'));
    }
  }

  return (
    <div className="container">
      <div className="card authCard animate-pop">
      <div className="auth-icon" aria-hidden="true">
        <Icon name="student" size={22} />
      </div>
      <h1 className="page-title">Student Login</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', marginTop: 8 }}
        >
          Login
        </button>
      </form>

      <div className="divider">or</div>

      <button
        onClick={async () => {
          try {
            setError('');
            await signInWithGoogle('student');
            router.push('/dashboard/student');
          } catch (err) {
            setError(friendlyError(err, 'Could not sign in with Google. Please try again.'));
          }
        }}
        className="oauth-btn"
      >
        <Icon name="google" size={18} />
        Sign in with Google
      </button>

      <p className="auth-footer">
        No account? <Link href="/register/student">Register here</Link>
      </p>
      </div>
    </div>
  );
}