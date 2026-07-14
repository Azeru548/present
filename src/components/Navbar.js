'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/lib/auth';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, role, userData } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logoLink}>
        <img src="/logopresent.png" alt="Present" className={styles.logoImg} />
        <span className={styles.logoText}>Present</span>
      </Link>
      <div className={styles.links}>
        {user ? (
          <>
            <span className={styles.greeting}>
              {userData?.name} ({role})
            </span>
            <Link
              href={role === 'lecturer' ? '/dashboard/lecturer' : '/dashboard/student'}
              className={styles.link}
            >
              Dashboard
            </Link>
            <button onClick={handleLogout} className={styles.btn}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login/lecturer" className={styles.link}>Lecturer</Link>
            <Link href="/login/student" className={styles.link}>Student</Link>
          </>
        )}
      </div>
    </nav>
  );
}
