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
