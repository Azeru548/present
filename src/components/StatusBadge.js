export default function StatusBadge({ tone = 'closed', children, icon }) {
  return (
    <span className={`badge badge-${tone}`}>
      {children}
      {icon || null}
    </span>
  );
}