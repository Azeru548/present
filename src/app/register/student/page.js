'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerWithRole } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { friendlyError } from '@/lib/errors';
import { LEVELS, DEPARTMENTS } from '@/lib/constants';
import FaceEnrollment from '@/components/FaceEnrollment';
import Icon from '@/components/Icon';

export default function StudentRegister() {
  const [step, setStep] = useState('form'); // form | enroll
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { refreshUserData } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await registerWithRole(email, password, name, 'student', {
        level,
        department,
      });
      await refreshUserData();
      setUserId(user.uid);
      setStep('enroll');
    } catch (err) {
      setError(friendlyError(err, 'Could not create your account. Please try again.'));
    }
  }

  if (step === 'enroll') {
    return (
      <div className="container">
        <div className="card animate-pop" style={{ maxWidth: 520, margin: '40px auto' }}>
        <div className="auth-icon" aria-hidden="true">
          <Icon name="face" size={22} />
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
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card authCard animate-pop">
      <div className="auth-icon" aria-hidden="true">
        <Icon name="edit" size={22} />
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
        <div className="form-group">
          <label>Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            required
          >
            <option value="" disabled>
              Select your level
            </option>
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            required
          >
            <option value="" disabled>
              Select your department
            </option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
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
    </div>
  );
}