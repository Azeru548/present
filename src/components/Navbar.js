'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/lib/auth';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, role, userData } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleLogout() {
    await logout();
    // Wait for auth state to clear before redirecting
    router.push('/login');
  }

  function closeMenu() {
    setOpen(false);
  }

  const dashboardHref =
    role === 'lecturer' ? '/dashboard/lecturer' : '/dashboard/student';

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
      <Link href="/" className={styles.logoLink} onClick={closeMenu}>
        <img src="/logopresent.png" alt="Present" className={styles.logoImg} />
        <span className={styles.logoText}>Present</span>
      </Link>

      <div
        id="site-menu"
        className={`${styles.links} ${open ? styles.linksOpen : ''}`}
      >
        {!user && (
          <>
            <Link href="/#features" className={styles.link} onClick={closeMenu}>
              Capabilities
            </Link>
            <Link href="/#how-it-works" className={styles.link} onClick={closeMenu}>
              How it works
            </Link>
            <Link href="/#for-whom" className={styles.link} onClick={closeMenu}>
              Who it serves
            </Link>
          </>
        )}

        {user ? (
          <>
            <span className={styles.greeting}>
              {userData?.name} <b>({role})</b>
            </span>
            <Link href="/" className={styles.link} onClick={closeMenu}>
              Home
            </Link>
            <Link href={dashboardHref} className={styles.link} onClick={closeMenu}>
              Dashboard
            </Link>
            {role === 'student' && (
              <>
                <Link href="/dashboard/lectures" className={styles.link} onClick={closeMenu}>
                  Lectures
                </Link>
                <Link href="/dashboard/student/attendance" className={styles.link} onClick={closeMenu}>
                  History
                </Link>
              </>
            )}
            <button onClick={handleLogout} className={styles.btn}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className={styles.link} onClick={closeMenu}>
              Login
            </Link>
            <Link
              href="/register/student"
              className={`${styles.btn} ${styles.btnCta}`}
              onClick={closeMenu}
            >
              Get Started
            </Link>
          </>
        )}
      </div>

      <button
        className={`${styles.hamburger} ${open ? styles.hamburgerOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle navigation menu"
        aria-expanded={open}
        aria-controls="site-menu"
      >
        <span className={styles.bar} />
        <span className={styles.bar} />
        <span className={styles.bar} />
      </button>
    </nav>
  );
}
