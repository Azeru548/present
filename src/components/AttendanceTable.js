import styles from './AttendanceTable.module.css';

export default function AttendanceTable({ records, loading }) {
  if (loading) return <p className={styles.muted}>Loading attendance...</p>;
  if (!records || records.length === 0)
    return <p className={styles.muted}>No students have marked attendance yet.</p>;

  return (
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
          <tr key={r.id}>
            <td>{i + 1}</td>
            <td>{r.studentName}</td>
            <td>{r.studentEmail}</td>
            <td>{r.geoVerified ? 'Yes' : 'No'}</td>
            <td>{r.faceVerified ? 'Yes' : 'No'}</td>
            <td>{r.timestamp?.toDate?.().toLocaleString() || 'N/A'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
