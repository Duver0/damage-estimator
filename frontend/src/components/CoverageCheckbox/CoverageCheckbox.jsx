import styles from './CoverageCheckbox.module.css';

export default function CoverageCheckbox({ coverage, checked, onChange }) {
  return (
    <label className={`${styles.wrapper} ${coverage.obligatoria ? styles.mandatory : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={coverage.obligatoria}
        className={styles.checkbox}
        aria-label={coverage.nombre}
      />
      <div className={styles.info}>
        <span className={styles.name}>{coverage.nombre}</span>
        {coverage.descripcion && (
          <span className={styles.desc}>{coverage.descripcion}</span>
        )}
        {coverage.obligatoria && (
          <span className={styles.mandatoryTag}>Obligatoria</span>
        )}
      </div>
    </label>
  );
}
