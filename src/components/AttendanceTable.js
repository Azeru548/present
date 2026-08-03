import styles from './AttendanceTable.module.css';
import Loading from './Loading';

function Pill({ ok }) {
  return (
    <span className={ok ? styles.pillYes : styles.pillNo}>
      {ok ? 'Yes' : 'No'}
    </span>
  );
}

export default function AttendanceTable({ records, loading }) {
  if (loading) return <Loading text="Loading attendance..." />;
  if (!records || records.length === 0)
    return <p className={styles.muted}>No students have marked attendance yet.</p>;

  return (
    <div className={styles.scrollWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Student Name</th>
            <th>Email</th>
            <th>Geo Verified</th>
            <th>Face Verified</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={r.id} className={styles.row}>
              <td>{i + 1}</td>
              <td>{r.studentName}</td>
              <td>{r.studentEmail}</td>
              <td>
                <Pill ok={r.geoVerified} />
              </td>
              <td>
                <Pill ok={r.faceVerified} />
              </td>
              <td>{r.timestamp?.toDate?.().toLocaleString() || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}