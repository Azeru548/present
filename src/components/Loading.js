import styles from './Loading.module.css';

export default function Loading({ text = 'Loading...' }) {
  return (
    <div className={styles.wrapper} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.text}>{text}</span>
    </div>
  );
}
