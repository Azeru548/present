import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.brandRow}>
              <img src="/logopresent.png" alt="Present" className={styles.logo} />
              <span className={styles.brandName}>Present</span>
            </div>
            <p className={styles.tagline}>
              Geo-location and facial recognition verified attendance for
              classrooms that need records they can trust.
            </p>
          </div>

          <div className={styles.columns}>
            <div className={styles.col}>
              <p className={styles.colTitle}>Product</p>
              <Link href="/#features">Capabilities</Link>
              <Link href="/#how-it-works">How it works</Link>
              <Link href="/#for-whom">For lecturers &amp; students</Link>
            </div>
            <div className={styles.col}>
              <p className={styles.colTitle}>Accounts</p>
              <Link href="/register/student">Student sign up</Link>
              <Link href="/register/lecturer">Lecturer sign up</Link>
              <Link href="/login/student">Student login</Link>
              <Link href="/login/lecturer">Lecturer login</Link>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <span>© {new Date().getFullYear()} Present. All rights reserved.</span>
          <span className={styles.bottomNote}>Attendance, verified.</span>
        </div>
      </div>
    </footer>
  );
}
