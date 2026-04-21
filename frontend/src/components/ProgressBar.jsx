import styles from './ProgressBar.module.css';

const STEPS = [
  { label: 'Crear Folio', key: 'folio' },
  { label: 'Datos Generales', key: 'general' },
  { label: 'Ubicaciones', key: 'locations' },
  { label: 'Cobertura', key: 'coverage' },
  { label: 'Resultado', key: 'result' },
];

export default function ProgressBar({ currentStep = 0, totalSteps = 5 }) {
  return (
    <nav className={styles.nav} aria-label="Progreso de cotización">
      <ol className={styles.steps}>
        {STEPS.slice(0, totalSteps).map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          return (
            <li
              key={step.key}
              className={`${styles.step} ${isCompleted ? styles.completed : ''} ${isActive ? styles.active : ''}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className={styles.circle}>
                {isCompleted ? '✓' : idx + 1}
              </span>
              <span className={styles.label}>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
