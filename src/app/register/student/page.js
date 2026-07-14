'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerWithRole } from '@/lib/auth';
import { enrollFace } from '@/lib/face';

export default function StudentRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [faceStatus, setFaceStatus] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFaceStatus('');
    try {
      const user = await registerWithRole(email, password, name, 'student');
      setFaceStatus('Enrolling your face...');
      await enrollFace(user.uid);
      setFaceStatus('Face enrolled successfully!');
      setTimeout(() => router.push('/dashboard/student'), 1500);
    } catch (err) {
      setError(err.message);
      setFaceStatus('');
    }
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
        {faceStatus && <p className={faceStatus.includes('success') ? 'success' : ''} style={{ marginTop: 8 }}>{faceStatus}</p>}
        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
          Register & Enroll Face
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: '0.85rem', textAlign: 'center' }}>
        Already have an account? <Link href="/login/student">Login here</Link>
      </p>
    </div>
  );
}
