import styles from './InputField.module.css';

export default function InputField({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder = '',
  type = 'text',
  required = false,
  disabled = false,
}) {
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={name}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        aria-describedby={error ? `${name}-error` : undefined}
        aria-invalid={!!error}
      />
      {error && (
        <p className={styles.errorText} id={`${name}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
