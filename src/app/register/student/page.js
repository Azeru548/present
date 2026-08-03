'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerWithRole } from '@/lib/auth';
import FaceEnrollment from '@/components/FaceEnrollment';

export default function StudentRegister() {
  const [step, setStep] = useState('form'); // form | enroll
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await registerWithRole(email, password, name, 'student');
      setUserId(user.uid);
      setStep('enroll');
    } catch (err) {
      setError(err.message);
    }
  }

  if (step === 'enroll') {
    return (
      <div className="card animate-pop" style={{ maxWidth: 520, margin: '40px auto' }}>
        <div className="auth-icon" aria-hidden="true">
          😀
        </div>
        <h1 className="page-title" style={{ textAlign: 'center' }}>
          Enroll Your Face
        </h1>
        <p style={{ color: 'var(--ink-2)', textAlign: 'center', marginBottom: 20 }}>
          This helps verify your identity when marking attendance. You can
          re-enroll later from your dashboard if needed.
        </p>
        <FaceEnrollment
          userId={userId}
          onComplete={() => setTimeout(() => router.push('/dashboard/student'), 1500)}
          onCancel={() => router.push('/dashboard/student')}
        />
        <p className="auth-footer">
          <Link href="/dashboard/student">Skip for now</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="card authCard animate-pop">
      <div className="auth-icon" aria-hidden="true">
        ✏️
      </div>
      <h1 className="page-title">Student Registration</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            placeholder="Jane Doe"
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
          Create Account
        </button>
      </form>
      <p className="auth-footer">
        Already have an account? <Link href="/login/student">Login here</Link>
      </p>
    </div>
  );
}