'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, signInWithGoogle, getUserData } from '@/lib/auth';

export default function LecturerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      const data = await getUserData(user.uid);
      if (data?.role !== 'lecturer') {
        setError('This account is not registered as a lecturer.');
        return;
      }
      router.push('/dashboard/lecturer');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="container">
      <div className="card authCard animate-pop">
      <div className="auth-icon" aria-hidden="true">
        🎓
      </div>
      <h1 className="page-title">Lecturer Login</h1>
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
            await signInWithGoogle('lecturer');
            router.push('/dashboard/lecturer');
          } catch (err) {
            setError(err.message);
          }
        }}
        className="oauth-btn"
      >
        <span aria-hidden="true">🌐</span>
        Sign in with Google
      </button>

      <p className="auth-footer">
        No account? <Link href="/register/lecturer">Register here</Link>
      </p>
      </div>
    </div>
  );
}