'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { updateUserProfile } from '@/lib/auth';
import { useRequireRole } from '@/lib/useRequireRole';
import { friendlyError } from '@/lib/errors';
import { LEVELS, DEPARTMENTS } from '@/lib/constants';
import Loading from '@/components/Loading';
import FaceEnrollment from '@/components/FaceEnrollment';
import Icon from '@/components/Icon';

export default function StudentDashboard() {
  const { user, userData, refreshUserData, ready } = useRequireRole('student');
  const [enrolled, setEnrolled] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [level, setLevel] = useState('');
  const [department, setDepartment] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    setEnrolled(userData?.faceEnrolled === true);
  }, [userData?.faceEnrolled]);

  useEffect(() => {
    setLevel(userData?.level || '');
    setDepartment(userData?.department || '');
  }, [userData?.level, userData?.department]);

  if (!ready) return <Loading />;

  const missingProfile = !userData?.level || !userData?.department;

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await updateUserProfile(user.uid, { level, department });
      await refreshUserData();
      setProfileMsg('Profile updated!');
      setTimeout(() => {
        setProfileMsg('');
        setProfileOpen(false);
      }, 1500);
    } catch (err) {
      setProfileMsg(friendlyError(err, 'Could not save your profile.'));
    } finally {
      setProfileSaving(false);
    }
  }

  return (
    <div className="container">
      <div className="card animate-rise">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                fontSize: '1.8rem',
                width: 52,
                height: 52,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 14,
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
              }}
              aria-hidden="true"
            >
              <Icon name={enrolled ? 'userCheck' : 'face'} size={26} />
            </span>
            <div>
              <h2 className="subtitle" style={{ marginBottom: 2 }}>
                Face Enrollment
              </h2>
              <p style={{ color: 'var(--ink-2)', fontSize: '0.9rem' }}>
                {enrolled
                  ? 'Your face is enrolled. You can update it anytime.'
                  : 'Your face is not enrolled yet. Enroll now to mark attendance.'}
              </p>
            </div>
          </div>
          <button
            className={enrolled ? 'btn-primary' : 'btn-success'}
            onClick={() => setShowEnroll((v) => !v)}
          >
            {enrolled ? 'Update Face' : 'Enroll Face'}
          </button>
        </div>
        {showEnroll && (
          <div style={{ marginTop: 20 }} className="animate-pop">
            <FaceEnrollment
              userId={user.uid}
              onComplete={() => {
                setEnrolled(true);
                setShowEnroll(false);
                refreshUserData();
              }}
              onCancel={() => setShowEnroll(false)}
            />
          </div>
        )}
      </div>

      <div className="card animate-rise">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h2 className="subtitle" style={{ marginBottom: 2 }}>
              My Profile
            </h2>
            <p style={{ color: 'var(--ink-2)', fontSize: '0.9rem' }}>
              {missingProfile
                ? 'Set your level and department to see lectures for you.'
                : `${userData.level} Level · ${userData.department}`}
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => setProfileOpen((v) => !v)}
          >
            {missingProfile ? 'Set Level & Department' : 'Edit Profile'}
          </button>
        </div>
        {profileOpen && (
          <form
            className="animate-pop"
            style={{ marginTop: 18, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
            onSubmit={handleSaveProfile}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select level
                </option>
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select department
                </option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="submit"
                className="btn-success"
                disabled={profileSaving}
              >
                {profileSaving ? 'Saving...' : 'Save'}
              </button>
              {profileMsg && (
                <span className={profileMsg.includes('updated') ? 'success' : 'error'}>
                  {profileMsg}
                </span>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="card animate-rise">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h2 className="subtitle" style={{ marginBottom: 2 }}>
              Live Lectures
            </h2>
            <p style={{ color: 'var(--ink-2)', fontSize: '0.9rem' }}>
              See live classes and mark your attendance.
            </p>
          </div>
          <Link href="/dashboard/lectures" className="btn-primary">
            View Lectures →
          </Link>
        </div>
      </div>
    </div>
  );
}
