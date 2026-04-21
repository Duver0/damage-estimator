import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner({ visible = true, message = 'Cargando...' }) {
  if (!visible) return null;
  return (
    <div className={styles.wrapper} role="status" aria-label={message}>
      <div className={styles.spinner} />
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
