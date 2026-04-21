import styles from './LocationCard.module.css';

export default function LocationCard({ location, index, onEdit, isComplete }) {
  const statusClass = isComplete ? styles.complete : styles.incomplete;
  const statusLabel = isComplete ? 'COMPLETA' : 'INCOMPLETA';

  return (
    <div className={`${styles.card} ${statusClass}`}>
      <div className={styles.header}>
        <h3 className={styles.name}>
          Ubicación {index + 1}: {location.nombre_ubicacion || 'Sin nombre'}
        </h3>
        <span className={`${styles.badge} ${statusClass}`}>{statusLabel}</span>
      </div>
      <div className={styles.body}>
        {location.direccion && <p className={styles.info}>{location.direccion}</p>}
        {location.codigo_postal && (
          <p className={styles.info}>CP: {location.codigo_postal} | {location.estado}</p>
        )}
        {location.giro?.descripcion && (
          <p className={styles.info}>Giro: {location.giro.descripcion}</p>
        )}
        {!isComplete && location.alertas_bloqueantes?.length > 0 && (
          <ul className={styles.alerts}>
            {location.alertas_bloqueantes.map((a, i) => (
              <li key={i} className={styles.alert}>
                {a.mensaje}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={styles.actions}>
        <button className={styles.editBtn} onClick={() => onEdit?.(index)}>
          Editar
        </button>
      </div>
    </div>
  );
}
