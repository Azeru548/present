'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, signInWithGoogle, getUserData } from '@/lib/auth';

export default function StudentLogin() {
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
      if (data?.role !== 'student') {
        setError('This account is not registered as a student.');
        return;
      }
      router.push('/dashboard/student');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 400, margin: '40px auto' }}>
      <h1 className="page-title">Student Login</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
          Login
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #d1d5db' }} />
        <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>or</span>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #d1d5db' }} />
      </div>

      <button
        onClick={async () => {
          try {
            setError('');
            await signInWithGoogle('student');
            router.push('/dashboard/student');
          } catch (err) {
            setError(err.message);
          }
        }}
        className="btn-primary"
        style={{ width: '100%', background: '#fff', color: '#333', border: '1px solid #ddd' }}
      >
        Sign in with Google
      </button>
      <p style={{ marginTop: 16, fontSize: '0.85rem', textAlign: 'center' }}>
        No account? <Link href="/register/student">Register here</Link>
      </p>
    </div>
  );
}
