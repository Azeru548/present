'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function Home() {
  const { user, role } = useAuth();

  return (
    <div className={styles.hero}>
      <div className={`${styles.blob} ${styles.blob1}`} aria-hidden="true" />
      <div className={`${styles.blob} ${styles.blob2}`} aria-hidden="true" />

      <div className={styles.inner}>
        <img src="/logopresent.png" alt="Present" className={styles.logoHero} />
        <h1 className={`${styles.title} animate-rise`}>
          <span className={styles.accent}>Present</span>
        </h1>
        <p className={`${styles.subtitle} animate-rise`}>
          Geo-location verified attendance with facial recognition
        </p>

        <div className={`${styles.choices} animate-rise`}>
          {user ? (
            <Link
              href={
                role === 'lecturer'
                  ? '/dashboard/lecturer'
                  : '/dashboard/student'
              }
              className={styles.cta}
            >
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/register/lecturer" className={styles.cta}>
                Register as Lecturer
              </Link>
              <Link href="/register/student" className={styles.ctaOutline}>
                <span>Register as Student</span>
              </Link>
            </>
          )}
        </div>

        {!user && (
          <div className={`${styles.taglineWrap} animate-rise`}>
            <span className={styles.dot} aria-hidden="true" />
            Trusted verification, everywhere
          </div>
        )}
      </div>
    </div>
  );
}