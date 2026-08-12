'use client';
import Link from 'next/link';
import styles from './SessionRow.module.css';

export default function SessionRow({
  title,
  meta,
  tags,
  note,
  trailing,
  onClick,
  href,
  active = false,
  delay = 0,
}) {
  const body = (
    <>
      <div className={styles.main}>
        <strong className={styles.title}>{title}</strong>
        {meta && <span className={styles.meta}>{meta}</span>}
        {tags && tags.length > 0 && (
          <span className={styles.tags}>{tags.join(' · ')}</span>
        )}
        {note && <span className={styles.note}>{note}</span>}
      </div>
      {trailing && <div className={styles.trailing}>{trailing}</div>}
    </>
  );

  const className = `${styles.row} ${active ? styles.active : ''}`;
  const style = delay ? { animationDelay: `${delay}ms` } : undefined;

  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {body}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={className} style={style} onClick={onClick}>
        {body}
      </button>
    );
  }

  return (
    <div className={className} style={style}>
      {body}
    </div>
  );
}