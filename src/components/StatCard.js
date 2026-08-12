export default function StatCard({ value, label, positive = false }) {
  return (
    <div className={`stat-card ${positive ? 'stat-card-positive' : ''}`}>
      <span className="stat-card-value">{value}</span>
      <span className="stat-card-label">{label}</span>
    </div>
  );
}