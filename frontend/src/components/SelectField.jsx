import styles from './SelectField.module.css';

export default function SelectField({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  loading = false,
  required = false,
  disabled = false,
  placeholder = 'Seleccionar...',
}) {
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={name}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled || loading}
        className={`${styles.select} ${error ? styles.selectError : ''}`}
        aria-invalid={!!error}
      >
        <option value="">{loading ? 'Cargando...' : placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}
