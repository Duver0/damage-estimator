import styles from './AlertBox.module.css';

const TYPE_CLASSES = {
  error: styles.error,
  warning: styles.warning,
  success: styles.success,
  info: styles.info,
};

export default function AlertBox({ type = 'info', message, onClose }) {
  if (!message) return null;
  return (
    <div className={`${styles.box} ${TYPE_CLASSES[type] || styles.info}`} role="alert">
      <span className={styles.text}>{message}</span>
      {onClose && (
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar alerta">
          &times;
        </button>
      )}
    </div>
  );
}
