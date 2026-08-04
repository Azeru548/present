import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <img src="/logopresent.png" alt="Present" className={styles.logo} />
            <p className={styles.tagline}>
              Geo and face verified attendance, built for honest classrooms.
            </p>
          </div>

          <div className={styles.columns}>
            <div className={styles.col}>
              <p className={styles.colTitle}>Product</p>
              <Link href="/#features">Features</Link>
              <Link href="/#how-it-works">How it works</Link>
              <Link href="/dashboard/student">Student Dashboard</Link>
            </div>
            <div className={styles.col}>
              <p className={styles.colTitle}>Get Started</p>
              <Link href="/register/student">Student Sign up</Link>
              <Link href="/register/lecturer">Lecturer Sign up</Link>
              <Link href="/login/student">Login</Link>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <span>© {new Date().getFullYear()} Present. All rights reserved.</span>
          <span>Attendance, verified.</span>
        </div>
      </div>
    </footer>
  );
}
