'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function Home() {
  const { user, role } = useAuth();

  return (
    <div className={styles.hero}>
      <img src="/logopresent.png" alt="Present" className={styles.logoHero} />
      <h1 className={styles.title}>
        <span className={styles.accent}>Present</span>
      </h1>
      <p className={styles.subtitle}>
        Geo-location verified attendance with facial recognition
      </p>

      {user ? (
        <Link
          href={role === 'lecturer' ? '/dashboard/lecturer' : '/dashboard/student'}
          className={styles.cta}
        >
          Go to Dashboard
        </Link>
      ) : (
        <div className={styles.choices}>
          <Link href="/register/lecturer" className={styles.cta}>
            Register as Lecturer
          </Link>
          <Link href="/register/student" className={styles.cta}>
            Register as Student
          </Link>
        </div>
      )}
    </div>
  );
}
