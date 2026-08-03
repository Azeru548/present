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
      <div className="card" style={{ maxWidth: 500, margin: '40px auto' }}>
        <h1 className="page-title" style={{ textAlign: 'center' }}>
          Enroll Your Face
        </h1>
        <p style={{ color: '#888', textAlign: 'center', marginBottom: 20 }}>
          This helps verify your identity when marking attendance. You can
          re-enroll later from your dashboard if needed.
        </p>
        <FaceEnrollment
          userId={userId}
          onComplete={() => setTimeout(() => router.push('/dashboard/student'), 1500)}
          onCancel={() => router.push('/dashboard/student')}
        />
        <p style={{ marginTop: 16, fontSize: '0.85rem', textAlign: 'center' }}>
          <Link href="/dashboard/student">Skip for now</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 400, margin: '40px auto' }}>
      <h1 className="page-title">Student Registration</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
          Create Account
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: '0.85rem', textAlign: 'center' }}>
        Already have an account? <Link href="/login/student">Login here</Link>
      </p>
    </div>
  );
}
