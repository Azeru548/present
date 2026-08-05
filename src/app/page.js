'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const features = [
  {
    icon: '📍',
    title: 'Geo-Location Verified',
    desc: 'Students must be physically present within a set radius of the classroom before they can sign in.',
  },
  {
    icon: '😀',
    title: 'Facial Recognition',
    desc: 'A quick camera check confirms each student\u2019s identity, putting an end to buddy check-ins.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Dashboard',
    desc: 'Lecturers watch attendance come in live as students arrive and verify themselves.',
  },
  {
    icon: '📊',
    title: 'Automatic Records',
    desc: 'Every sign-in is logged with time, distance and verification status \u2014 no manual bookkeeping.',
  },
  {
    icon: '🛡️',
    title: 'Anti-Fraud Built In',
    desc: 'GPS plus face matching makes it nearly impossible to mark attendance for someone else.',
  },
  {
    icon: '📱',
    title: 'Works Anywhere',
    desc: 'Responsive and mobile-first, so it runs smoothly on phones, tablets and laptops.',
  },
];

const steps = [
  {
    num: '1',
    title: 'Create a session',
    desc: 'Lecturers set the title, course, geo-radius and duration. The classroom location is locked in automatically.',
  },
  {
    num: '2',
    title: 'Verify location',
    desc: 'Students open the session and confirm they are within range of the classroom using GPS.',
  },
  {
    num: '3',
    title: 'Confirm identity',
    desc: 'A quick facial match checks the student is who they say they are \u2014 attendance is logged instantly.',
  },
];

export default function Home() {
  const { user, role } = useAuth();
  const dashboardHref =
    role === 'lecturer' ? '/dashboard/lecturer' : '/dashboard/student';

  return (
    <>
      <section className={styles.hero}>
        <div className={`${styles.blob} ${styles.blob1}`} aria-hidden="true" />
        <div className={`${styles.blob} ${styles.blob2}`} aria-hidden="true" />

        <div className={styles.container}>
          <div className={styles.heroInner}>
            <div>
              <span className={styles.badge}>
                <span className={styles.badgeDot} aria-hidden="true" />
                Geo-verified · Face-verified · Real-time
              </span>

              <h1 className={styles.title}>
                Attendance that <span className={styles.accent}>can&rsquo;t be faked.</span>
              </h1>

              <p className={styles.subtitle}>
                Present combines GPS location checks with facial recognition, so
                every sign-in is genuine — in seconds, with zero paperwork.
              </p>

              <div className={styles.actions}>
                {user ? (
                  <Link
                    href={dashboardHref}
                    className={`${styles.cta} ${styles.ctaPrimary}`}
                  >
                    Go to Dashboard <span aria-hidden="true">→</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register/student"
                      className={`${styles.cta} ${styles.ctaPrimary}`}
                    >
                      Get Started Free <span aria-hidden="true">→</span>
                    </Link>
                    <Link
                      href="/register/lecturer"
                      className={`${styles.cta} ${styles.ctaGhost}`}
                    >
                      I&rsquo;m a Lecturer
                    </Link>
                  </>
                )}
              </div>

{!user && (
                <div className={styles.heroFoot}>
                  <Link href="/login/student" className={styles.lecturerLink}>
                    Already have an account? <span>Sign in as Student →</span>
                  </Link>
                  <span className={styles.dividerDot} aria-hidden="true" />
                  <Link href="/login/lecturer" className={styles.lecturerLink}>
                    Sign in as Lecturer →
                  </Link>
                  <span className={styles.dividerDot} aria-hidden="true" />
                  <span className={styles.roles}>For students & lecturers</span>
                </div>
              )}
            </div>

            <div className={styles.previewWrap}>
              <div className={styles.preview} aria-hidden="true">
                <div className={styles.previewBar}>
                  <span className={styles.previewDotRed} />
                  <span className={styles.previewDotYellow} />
                  <span className={styles.previewDotGreen} />
                  <span className={styles.previewUrl}>app.present.com/dashboard</span>
                </div>
                <div className={styles.previewBody}>
                  <div className={styles.previewHeader}>
                    <div>
                      <p className={styles.previewCourse}>CS301 · Data Structures</p>
                      <h3 className={styles.previewTitle}>Lecture Session</h3>
                    </div>
                    <span className={styles.previewLive}>
                      <span className={styles.previewLiveDot} aria-hidden="true" />
                      Live
                    </span>
                  </div>

                  <div className={styles.previewStep}>
                    <span className={styles.previewStepIcon} aria-hidden="true">📍</span>
                    <div className={styles.previewStepBody}>
                      <p className={styles.previewStepLabel}>Step 1 · Location</p>
                      <p className={styles.previewStepText}>Verified · 12m from class</p>
                    </div>
                    <span className={styles.previewCheck}>✓</span>
                  </div>

                  <div className={styles.previewStep}>
                    <span className={styles.previewStepIcon} aria-hidden="true">😀</span>
                    <div className={styles.previewStepBody}>
                      <p className={styles.previewStepLabel}>Step 2 · Face</p>
                      <p className={styles.previewStepText}>Identity confirmed</p>
                    </div>
                    <span className={styles.previewCheck}>✓</span>
                  </div>

                  <div className={styles.previewSuccess}>
                    <span aria-hidden="true">🎉</span> Attendance recorded
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.stats}>
        <div className={styles.container}>
          <div className={styles.statCard}>
            <p className={styles.statValue}>2</p>
            <p className={styles.statLabel}>Verification layers</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statValue}>&lt; 5s</p>
            <p className={styles.statLabel}>To mark attendance</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statValue}>0</p>
            <p className={styles.statLabel}>Paper records needed</p>
          </div>
        </div>
      </section>

      <section id="features" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Features</span>
            <h2 className={styles.sectionTitle}>
              Everything you need to run honest attendance
            </h2>
            <p className={styles.sectionSub}>
              Built for classrooms, designed for trust. No spreadsheets, no guesswork.
            </p>
          </div>

          <div className={styles.featureGrid}>
            {features.map((f) => (
              <article key={f.title} className={styles.featureCard}>
                <div className={styles.featureIcon} aria-hidden="true">{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className={styles.sectionAlt}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>How it works</span>
            <h2 className={styles.sectionTitle}>Three steps. Zero guesswork.</h2>
            <p className={styles.sectionSub}>
              From session creation to a verified sign-in in under a minute.
            </p>
          </div>

          <div className={styles.steps}>
            {steps.map((s) => (
              <article key={s.num} className={styles.stepCard}>
                <div className={styles.stepNum} aria-hidden="true">{s.num}</div>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaBand}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>Ready to make attendance honest?</h2>
          <p className={styles.ctaSub}>Get started in seconds — it&rsquo;s free.</p>
          <div className={styles.actions}>
            {user ? (
              <Link
                href={dashboardHref}
                className={`${styles.cta} ${styles.ctaLight}`}
              >
                Go to Dashboard <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/register/student"
                  className={`${styles.cta} ${styles.ctaLight}`}
                >
                  Get Started Free <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/login/student"
                  className={`${styles.cta} ${styles.ctaGhostDark}`}
                >
                  Student Login
                </Link>
                <Link
                  href="/login/lecturer"
                  className={`${styles.cta} ${styles.ctaGhostDark}`}
                >
                  Lecturer Login
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
