import styles from './PriceBreakdown.module.css';

function formatMXN(value) {
  if (value == null) return '';
  return Number(value).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PriceBreakdown({ primaNeta, primaComercial, desglose }) {
  if (primaNeta == null && primaComercial == null) return null;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <p className={styles.cardTitle}>Resultado del Cálculo</p>

        <div className={styles.totals}>
          {primaNeta != null && (
            <div className={styles.row}>
              <span className={styles.rowLabel}>Prima Neta</span>
              <strong className={styles.rowValue}>
                <span className={styles.currency}>$</span>
                {formatMXN(primaNeta)}
              </strong>
            </div>
          )}

          {primaComercial != null && (
            <div className={`${styles.row} ${styles.highlight}`}>
              <p className={styles.highlightLabel}>Prima Comercial (incluye margen)</p>
              <p className={styles.highlightValue}>
                <span className={styles.currency}>$</span>
                <strong>{formatMXN(primaComercial)}</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {Array.isArray(desglose) && desglose.length > 0 && (
        <div className={styles.desglose}>
          <p className={styles.desgloseHeader}>Desglose por Ubicación</p>
          {desglose.map((ub, i) => (
            <div key={i} className={styles.ubicacion}>
              <p className={styles.ubName}>{ub.nombre_ubicacion || `Ubicación ${i + 1}`}</p>
              {ub.prima_neta_ubicacion != null && (
                <div className={styles.ubRow}>
                  <span>Prima Neta</span>
                  <strong>${formatMXN(ub.prima_neta_ubicacion)}</strong>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
