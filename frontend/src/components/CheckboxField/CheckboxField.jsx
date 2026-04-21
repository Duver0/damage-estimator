import styles from './CheckboxField.module.css';

export default function CheckboxField({ label, name, checked, onChange, disabled = false }) {
  return (
    <label className={`${styles.wrapper} ${disabled ? styles.disabled : ''}`}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={styles.checkbox}
      />
      <span className={styles.label}>{label}</span>
    </label>
  );
}
