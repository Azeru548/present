'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

/* Monochrome stroke icons — 24×24, currentColor */
function IconMapPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function IconFace() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <circle cx="9" cy="11" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11" r="1.25" fill="currentColor" stroke="none" />
      <path d="M9 15.5c1 1 2 1.5 3 1.5s2-.5 3-1.5" />
    </svg>
  );
}
function IconActivity() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <path d="M3 12h4l2.5-7 5 14 2.5-7H21" />
    </svg>
  );
}
function IconTable() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M3 10h18M3 15h18M9 10v10M15 10v10" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <path d="M12 3l8 3.5v5.5c0 5-3.5 8.5-8 9.5-4.5-1-8-4.5-8-9.5V6.5L12 3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function IconDevices() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <rect x="2" y="5" width="14" height="11" rx="1" />
      <path d="M2 13h14M8 16v2M6 18h4" />
      <rect x="17" y="8" width="5" height="9" rx="1" />
      <path d="M17 15h5" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" className={styles.iconInline}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="1" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M21 19c0-2.5-1.5-4-4-4" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    </svg>
  );
}

const features = [
  {
    Icon: IconMapPin,
    title: 'Geo-location verification',
    desc: 'Students must be within a configurable radius of the classroom. GPS proximity is checked before any attendance is accepted.',
  },
  {
    Icon: IconFace,
    title: 'Facial recognition',
    desc: 'An in-browser camera check matches the student to their enrolled face profile, stopping buddy check-ins and proxy sign-ins.',
  },
  {
    Icon: IconActivity,
    title: 'Live lecturer dashboard',
    desc: 'Watch attendance arrive in real time as students verify. Open sessions, close windows, and review results without refresh cycles.',
  },
  {
    Icon: IconTable,
    title: 'Automatic records',
    desc: 'Every sign-in is stored with timestamp, distance from class, and verification status — ready for export and review.',
  },
  {
    Icon: IconShield,
    title: 'Built-in anti-fraud',
    desc: 'No QR codes or shareable magic links. Dual checks and one mark per student per session reduce common attendance abuse.',
  },
  {
    Icon: IconDevices,
    title: 'Works on any device',
    desc: 'Designed for phones first — the tools students already carry — with full support for tablets and laptops.',
  },
];

const steps = [
  {
    num: '01',
    title: 'Create a session',
    desc: 'Lecturers set course details, geo-radius, and duration. The classroom location is captured at creation so proximity checks are accurate.',
  },
  {
    num: '02',
    title: 'Verify location',
    desc: 'Students open the live session and confirm they are within range using device GPS. Out-of-range attempts are rejected immediately.',
  },
  {
    num: '03',
    title: 'Confirm identity',
    desc: 'A short facial match confirms the student is present in person. Attendance is logged with time, distance, and status.',
  },
];

const lecturerPoints = [
  'Create and close attendance windows on demand',
  'Configure radius and session duration per lecture',
  'View organized attendance tables as students check in',
  'Rely on dual verification instead of manual roll call',
];

const studentPoints = [
  'Browse live sessions for your enrolled lectures',
  'Complete location and face checks in seconds',
  'Mark attendance once — no repeat or proxy marks',
  'Use phone, tablet, or laptop with a camera',
];

const integrityPoints = [
  {
    Icon: IconLock,
    title: 'No shareable shortcuts',
    desc: 'Attendance is not based on QR codes or forwarded links that anyone can open off-site.',
  },
  {
    Icon: IconUsers,
    title: 'One mark per student',
    desc: 'Each student can only record attendance once per session, reducing double-entry and fraud.',
  },
  {
    Icon: IconClock,
    title: 'Time-bound windows',
    desc: 'Sessions run for a defined duration. When the window closes, late or remote marks are blocked.',
  },
  {
    Icon: IconBook,
    title: 'Audit-ready logs',
    desc: 'Records include verification outcomes so lecturers can review how each mark was earned.',
  },
];

const metrics = [
  { value: '2', label: 'Verification layers per check-in' },
  { value: '< 5s', label: 'Typical time to mark attendance' },
  { value: '0', label: 'Paper records required' },
  { value: '1×', label: 'Mark allowed per student per session' },
];

export default function Home() {
  const { user, role } = useAuth();
  const dashboardHref =
    role === 'lecturer' ? '/dashboard/lecturer' : '/dashboard/student';

  const pageRef = useRef(null);
  const previewRef = useRef(null);
  const heroRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 20 });
  const [previewActive, setPreviewActive] = useState(false);

  /* prefers-reduced-motion */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /* Scroll reveals via IntersectionObserver */
  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    const els = root.querySelectorAll(`.${styles.reveal}`);
    if (reducedMotion) {
      els.forEach((el) => el.classList.add(styles.revealed));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reducedMotion]);

  /* Parallax + grid drift on scroll */
  useEffect(() => {
    if (reducedMotion) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        setScrollY(y);
        setGridOffset({
          x: (y * 0.04) % 48,
          y: (y * 0.08) % 48,
        });
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [reducedMotion]);

  /* Pointer spotlight across the page */
  const onPagePointerMove = useCallback(
    (e) => {
      if (reducedMotion || !pageRef.current) return;
      const rect = pageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setSpotlight({ x, y });
    },
    [reducedMotion]
  );

  const onPreviewMove = useCallback(
    (e) => {
      if (reducedMotion || !previewRef.current) return;
      const rect = previewRef.current.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      setTilt({
        x: (py - 0.5) * -10,
        y: (px - 0.5) * 12,
      });
    },
    [reducedMotion]
  );

  const onPreviewLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setPreviewActive(false);
  }, []);

  const heroParallax = reducedMotion ? 0 : scrollY * 0.18;
  const previewParallax = reducedMotion ? 0 : scrollY * 0.08;

  return (
    <div
      ref={pageRef}
      className={styles.page}
      onPointerMove={onPagePointerMove}
      style={{
        '--grid-x': `${gridOffset.x}px`,
        '--grid-y': `${gridOffset.y}px`,
        '--spot-x': `${spotlight.x}%`,
        '--spot-y': `${spotlight.y}%`,
      }}
    >
      <div className={styles.gridLayer} aria-hidden="true" />
      <div className={styles.spotlight} aria-hidden="true" />

      {/* Hero */}
      <section className={styles.hero} ref={heroRef}>
        <div className={styles.container}>
          <div className={styles.heroInner}>
            <div
              className={styles.heroCopy}
              style={{
                transform: reducedMotion
                  ? undefined
                  : `translate3d(0, ${heroParallax * 0.35}px, 0)`,
              }}
            >
              <h1 className={`${styles.title} ${styles.reveal}`} style={{ '--delay': '60ms' }}>
                Attendance that holds up under scrutiny.
              </h1>

              <p className={`${styles.subtitle} ${styles.reveal}`} style={{ '--delay': '120ms' }}>
                GPS and facial recognition verify every sign-in — so attendance
                reflects who was actually in the room.
              </p>

              <div className={`${styles.actions} ${styles.reveal}`} style={{ '--delay': '180ms' }}>
                {user ? (
                  <Link
                    href={dashboardHref}
                    className={`${styles.cta} ${styles.ctaPrimary}`}
                  >
                    Go to Dashboard
                    <IconArrowRight />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register/student"
                      className={`${styles.cta} ${styles.ctaPrimary}`}
                    >
                      Get started
                      <IconArrowRight />
                    </Link>
                    <Link
                      href="/register/lecturer"
                      className={`${styles.cta} ${styles.ctaSecondary}`}
                    >
                      Register as lecturer
                    </Link>
                  </>
                )}
              </div>

              {!user && (
                <p className={`${styles.heroFoot} ${styles.reveal}`} style={{ '--delay': '240ms' }}>
                  <Link href="/login/student">Student sign in</Link>
                  <span className={styles.footSep} aria-hidden="true">
                    ·
                  </span>
                  <Link href="/login/lecturer">Lecturer sign in</Link>
                </p>
              )}
            </div>

            <div
              className={styles.previewWrap}
              style={{
                transform: reducedMotion
                  ? undefined
                  : `translate3d(0, ${previewParallax}px, 0)`,
              }}
            >
              <div
                ref={previewRef}
                className={`${styles.preview} ${previewActive ? styles.previewActive : ''}`}
                aria-hidden="true"
                onPointerMove={onPreviewMove}
                onPointerEnter={() => setPreviewActive(true)}
                onPointerLeave={onPreviewLeave}
                style={
                  reducedMotion || (!previewActive && tilt.x === 0 && tilt.y === 0)
                    ? undefined
                    : {
                        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                      }
                }
              >
                <div className={styles.previewShine} />
                <div className={styles.previewBar}>
                  <span className={styles.previewUrl}>present · session view</span>
                  <span className={styles.previewStatus}>
                    <span className={styles.liveDot} />
                    Live
                  </span>
                </div>
                <div className={styles.previewBody}>
                  <div className={styles.previewHeader}>
                    <div>
                      <p className={styles.previewCourse}>CS301 · Data Structures</p>
                      <p className={styles.previewTitle}>Lecture session</p>
                    </div>
                  </div>

                  <div className={`${styles.previewStep} ${styles.stepAnim1}`}>
                    <span className={styles.previewStepIcon}>
                      <IconMapPin />
                    </span>
                    <div className={styles.previewStepBody}>
                      <p className={styles.previewStepLabel}>Location</p>
                      <p className={styles.previewStepText}>Verified · 12 m from class</p>
                    </div>
                    <span className={styles.previewCheck}>
                      <IconCheck />
                    </span>
                  </div>

                  <div className={`${styles.previewStep} ${styles.stepAnim2}`}>
                    <span className={styles.previewStepIcon}>
                      <IconFace />
                    </span>
                    <div className={styles.previewStepBody}>
                      <p className={styles.previewStepLabel}>Identity</p>
                      <p className={styles.previewStepText}>Facial match confirmed</p>
                    </div>
                    <span className={styles.previewCheck}>
                      <IconCheck />
                    </span>
                  </div>

                  <div className={`${styles.previewSuccess} ${styles.stepAnim3}`}>
                    <IconCheck />
                    <span>Attendance recorded</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className={styles.metrics} aria-label="Key metrics">
        <div className={styles.container}>
          <div className={styles.metricsGrid}>
            {metrics.map((m, i) => (
              <div
                key={m.label}
                className={`${styles.metric} ${styles.reveal}`}
                style={{ '--delay': `${i * 70}ms` }}
              >
                <p className={styles.metricValue}>{m.value}</p>
                <p className={styles.metricLabel}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.split}>
            <div className={`${styles.splitLead} ${styles.reveal}`}>
              <p className={styles.eyebrow}>The problem</p>
              <h2 className={styles.sectionTitle}>
                Traditional attendance is easy to game and hard to trust.
              </h2>
            </div>
            <div className={`${styles.splitBody} ${styles.reveal}`} style={{ '--delay': '100ms' }}>
              <p>
                Paper sheets get passed around. QR codes leave the room. Buddy
                check-ins inflate numbers. Lecturers spend valuable class time on
                roll call and still end up with incomplete or unreliable data.
              </p>
              <p>
                Present replaces those weak points with two checks that are hard
                to fake together: the student must be near the classroom, and
                their face must match the enrolled profile — before a mark is
                accepted.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.sectionMuted}>
        <div className={styles.container}>
          <div className={`${styles.sectionHead} ${styles.reveal}`}>
            <p className={styles.eyebrow}>Capabilities</p>
            <h2 className={styles.sectionTitle}>
              Built for honest, auditable classroom attendance
            </h2>
            <p className={styles.sectionSub}>
              Everything lecturers need to open a session, verify presence, and
              keep a clean record — without spreadsheets or guesswork.
            </p>
          </div>

          <div className={styles.featureGrid}>
            {features.map((f, i) => (
              <article
                key={f.title}
                className={`${styles.featureCard} ${styles.reveal}`}
                style={{ '--delay': `${i * 60}ms` }}
              >
                <div className={styles.featureIcon} aria-hidden="true">
                  <f.Icon />
                </div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className={styles.section}>
        <div className={styles.container}>
          <div className={`${styles.sectionHeadLeft} ${styles.reveal}`}>
            <p className={styles.eyebrow}>How it works</p>
            <h2 className={styles.sectionTitle}>Three steps from open session to verified mark</h2>
            <p className={styles.sectionSub}>
              From session creation to a dual-verified sign-in in under a minute.
            </p>
          </div>

          <ol className={styles.steps}>
            {steps.map((s, i) => (
              <li
                key={s.num}
                className={`${styles.stepCard} ${styles.reveal}`}
                style={{ '--delay': `${i * 90}ms` }}
              >
                <span className={styles.stepNum} aria-hidden="true">
                  {s.num}
                </span>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Audiences */}
      <section id="for-whom" className={styles.sectionMuted}>
        <div className={styles.container}>
          <div className={`${styles.sectionHead} ${styles.reveal}`}>
            <p className={styles.eyebrow}>Who it serves</p>
            <h2 className={styles.sectionTitle}>Designed for both sides of the classroom</h2>
          </div>

          <div className={styles.audienceGrid}>
            <article className={`${styles.audienceCard} ${styles.reveal}`}>
              <p className={styles.audienceLabel}>For lecturers</p>
              <h3 className={styles.audienceTitle}>Run sessions without the roll call ritual</h3>
              <ul className={styles.pointList}>
                {lecturerPoints.map((item) => (
                  <li key={item}>
                    <span className={styles.pointIcon} aria-hidden="true">
                      <IconCheck />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              {!user && (
                <Link href="/register/lecturer" className={styles.textLink}>
                  Create a lecturer account
                  <IconArrowRight />
                </Link>
              )}
            </article>

            <article
              className={`${styles.audienceCard} ${styles.reveal}`}
              style={{ '--delay': '100ms' }}
            >
              <p className={styles.audienceLabel}>For students</p>
              <h3 className={styles.audienceTitle}>Check in quickly when you are actually there</h3>
              <ul className={styles.pointList}>
                {studentPoints.map((item) => (
                  <li key={item}>
                    <span className={styles.pointIcon} aria-hidden="true">
                      <IconCheck />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              {!user && (
                <Link href="/register/student" className={styles.textLink}>
                  Create a student account
                  <IconArrowRight />
                </Link>
              )}
            </article>
          </div>
        </div>
      </section>

      {/* Integrity */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={`${styles.sectionHeadLeft} ${styles.reveal}`}>
            <p className={styles.eyebrow}>Integrity</p>
            <h2 className={styles.sectionTitle}>Controls that make records defensible</h2>
            <p className={styles.sectionSub}>
              Present is built so attendance data can be trusted — by lecturers,
              departments, and anyone reviewing the log later.
            </p>
          </div>

          <div className={styles.integrityGrid}>
            {integrityPoints.map((item, i) => (
              <article
                key={item.title}
                className={`${styles.integrityCard} ${styles.reveal}`}
                style={{ '--delay': `${i * 70}ms` }}
              >
                <div className={styles.integrityIcon} aria-hidden="true">
                  <item.Icon />
                </div>
                <div>
                  <h3 className={styles.integrityTitle}>{item.title}</h3>
                  <p className={styles.integrityDesc}>{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Stack note */}
      <section className={styles.sectionMuted}>
        <div className={styles.container}>
          <div className={styles.techStrip}>
            <div className={styles.reveal}>
              <p className={styles.eyebrow}>Under the hood</p>
              <h2 className={styles.sectionTitleSmall}>
                Modern web stack, on-device face matching
              </h2>
              <p className={styles.sectionSub}>
                Present runs on Next.js with Firebase authentication and
                Firestore for live session data. Facial recognition runs in the
                browser via face-api.js — your camera stream is used for matching
                on the device during check-in.
              </p>
            </div>
            <ul className={`${styles.techList} ${styles.reveal}`} style={{ '--delay': '120ms' }}>
              <li>Next.js App Router</li>
              <li>Firebase Auth &amp; Firestore</li>
              <li>Browser geolocation API</li>
              <li>face-api.js (client-side)</li>
              <li>Google or email sign-in</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaBand}>
        <div className={styles.ctaGrid} aria-hidden="true" />
        <div className={styles.container}>
          <div className={`${styles.ctaInner} ${styles.reveal}`}>
            <div>
              <h2 className={styles.ctaTitle}>Start taking attendance you can stand behind</h2>
              <p className={styles.ctaSub}>
                Open an account, create a session, and let location plus face
                verification do the rest.
              </p>
            </div>
            <div className={styles.actions}>
              {user ? (
                <Link
                  href={dashboardHref}
                  className={`${styles.cta} ${styles.ctaPrimary}`}
                >
                  Go to Dashboard
                  <IconArrowRight />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register/student"
                    className={`${styles.cta} ${styles.ctaPrimary}`}
                  >
                    Get started
                    <IconArrowRight />
                  </Link>
                  <Link
                    href="/login/student"
                    className={`${styles.cta} ${styles.ctaSecondary}`}
                  >
                    Student login
                  </Link>
                  <Link
                    href="/login/lecturer"
                    className={`${styles.cta} ${styles.ctaSecondary}`}
                  >
                    Lecturer login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
