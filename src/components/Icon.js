const ICONS = {
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="1" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </>
  ),
  student: (
    <>
      <path d="M2 9l10-5 10 5-10 5L2 9z" />
      <path d="M6 11.5V15c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.5" />
      <path d="M22 9v5" />
    </>
  ),
  lecturer: (
    <>
      <rect x="3" y="4" width="18" height="11" rx="1" />
      <path d="M6 13V8M10 13V6M14 13V9M18 13V7" />
      <path d="M8 15v3M16 15v3M6 18h12" />
      <path d="M12 18v3" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20l1.2-4L16.4 4.8a2.1 2.1 0 0 1 3 0 2.1 2.1 0 0 1 0 3L8.2 18.8 4 20z" />
      <path d="M14.5 6.5l3 3" />
    </>
  ),
  face: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <circle cx="9" cy="11" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11" r="1.25" fill="currentColor" stroke="none" />
      <path d="M9 15.5c1 1 2 1.5 3 1.5s2-.5 3-1.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  check: <path d="M5 12l5 5L20 7" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="1" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  userCheck: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c0-3 2.5-5 6-5 1.4 0 2.6.3 3.6.9" />
      <path d="M16 15l2 2 4-4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3.5v5.5c0 5-3.5 8.5-8 9.5-4.5-1-8-4.5-8-9.5V6.5L12 3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M21 19c0-2.5-1.5-4-4-4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  x: (
    <>
      <path d="M6 6l12 12M18 6L6 18" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4l9 16H3l9-16z" />
      <path d="M12 10v4M12 17.5v.01" />
    </>
  ),
  camera: (
    <>
      <rect x="2" y="6" width="15" height="12" rx="1" />
      <path d="M17 9l5-2v10l-5-2" />
      <circle cx="9.5" cy="12" r="3" />
    </>
  ),
  scan: (
    <>
      <rect x="3" y="8" width="18" height="11" rx="1" />
      <path d="M17 9.5l4-1.6v9.2l-4-1.6" />
      <path d="M11.6 12.5h.8M12 11.9v1.2" />
    </>
  ),
  reticle: (
    <>
      <ellipse cx="12" cy="12" rx="9" ry="6.5" />
      <path d="M12 3.5v2.4M9 3.5h6" />
      <path d="M12 18.1v2.4M9 20.5h6" />
      <path d="M3.5 12h2.4M3.5 9v6" />
      <path d="M18.1 12h2.4M20.5 9v6" />
      <path d="M10.5 10v4M12 12h.01" />
    </>
  ),
  crosshair: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 2.5v4M12 17.5v4M21.5 12h-4M6.5 12h-4" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  chevronRight: <path d="M9 6l6 6-6 6" />,
  cameraX: (
    <>
      <rect x="2" y="6" width="15" height="12" rx="1" />
      <path d="M17 9l5-2v10l-5-2" />
      <path d="M12 2.5v2M6.5 2l1.5 2.5M9 4.5L14 2" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v11M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  location: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  navigate: (
    <>
      <path d="M12 3l8 16-8-4-8 4 8-16z" />
      <path d="M12 3v12" />
    </>
  ),
  logout: (
    <>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M9 8l-4 4 4 4M5 12h11" />
    </>
  ),
  refresh: (
    <>
      <path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2" />
      <path d="M20 4v5h-5M4 20v-5h5" />
    </>
  ),
  home: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 9.5V21h14V9.5" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M3 10h18M3 15h18M9 10v10M15 10v10" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    </>
  ),
  google: (
    <path
      fill="currentColor"
      stroke="none"
      d="M12 5c3.2 0 5.4 1.9 6 3.1l2.6-1.3C19.4 4.6 16 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c3.1 0 5.7-1.2 7.4-3.2l-2.9-2.2c-1.1 1.3-2.5 2-4.5 2-3.4 0-5.9-2.5-5.9-5.9S8.6 6.2 12 5z"
    />
  ),
};

export default function Icon({
  name,
  size = 20,
  strokeWidth = 1.5,
  className = '',
  style,
  ...props
}) {
  const content = ICONS[name];
  if (!content) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      className={className}
      style={style}
      {...props}
    >
      {content}
    </svg>
  );
}