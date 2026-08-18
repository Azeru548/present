'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerWithRole } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { friendlyError } from '@/lib/errors';
import Icon from '@/components/Icon';

export default function LecturerRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { refreshUserData } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await registerWithRole(email, password, name, 'lecturer');
      await refreshUserData();
      router.replace('/dashboard/lecturer');
    } catch (err) {
      setError(friendlyError(err, 'Could not create your account. Please try again.'));
    }
  }

  return (
    <div className="container">
      <div className="card authCard animate-pop">
      <div className="auth-icon" aria-hidden="true">
        <Icon name="edit" size={22} />
      </div>
      <h1 className="page-title">Lecturer Registration</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            placeholder="Prof. Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', marginTop: 8 }}
        >
          Register
        </button>
      </form>
      <p className="auth-footer">
        Already have an account? <Link href="/login/lecturer">Login here</Link>
      </p>
      </div>
    </div>
  );
}