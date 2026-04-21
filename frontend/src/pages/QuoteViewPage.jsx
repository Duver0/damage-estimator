import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { obtenerEstado } from '../services/cotizacionService';
import HeaderNav from '../components/HeaderNav';
import AlertBox from '../components/AlertBox';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from './QuoteViewPage.module.css';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' });

export default function QuoteViewPage() {
  const { folio } = useParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!folio) return;
    obtenerEstado(folio)
      .then(setEstado)
      .catch(() => setError('No se pudo cargar la cotización'))
      .finally(() => setLoading(false));
  }, [folio]);

  if (loading) return <LoadingSpinner message="Cargando cotización..." />;
  if (error) return <AlertBox type="error" message={error} />;
  if (!estado) return <AlertBox type="error" message="Cotización no encontrada" />;

  const { estados_seccion, prima_neta, prima_comercial, alertas } = estado;

  return (
    <div className={styles.page}>
      <HeaderNav folio={folio} />
      <main className={styles.main}>
        <h1 className={styles.title}>Cotización: {folio}</h1>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Estado</h2>
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <span className={styles.label}>Datos Generales:</span>
              <span className={estados_seccion.datos_generales_completo ? styles.complete : styles.incomplete}>
                {estados_seccion.datos_generales_completo ? '✓ Completo' : '✗ Incompleto'}
              </span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.label}>Ubicaciones Capturadas:</span>
              <span>{estados_seccion.ubicaciones_capturadas}</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.label}>Ubicaciones Completas:</span>
              <span>{estados_seccion.ubicaciones_completas}</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.label}>Ubicaciones Incompletas:</span>
              <span>{estados_seccion.ubicaciones_incompletas}</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.label}>Coberturas Definidas:</span>
              <span className={estados_seccion.coberturas_definidas ? styles.complete : styles.incomplete}>
                {estados_seccion.coberturas_definidas ? '✓ Sí' : '✗ No'}
              </span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.label}>Cálculo Realizado:</span>
              <span className={estados_seccion.calculo_realizado ? styles.complete : styles.incomplete}>
                {estados_seccion.calculo_realizado ? '✓ Sí' : '✗ No'}
              </span>
            </div>
          </div>
        </section>

        {estados_seccion.calculo_realizado && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Resultado Financiero</h2>
            <div className={styles.financialBox}>
              <div className={styles.financialRow}>
                <span className={styles.label}>Prima Neta:</span>
                <span className={styles.amount}>{COP.format(prima_neta)}</span>
              </div>
              <div className={styles.financialRow}>
                <span className={styles.label}>Prima Comercial (margen 35%):</span>
                <span className={styles.amount}>{COP.format(prima_comercial)}</span>
              </div>
            </div>
          </section>
        )}

        {alertas.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Alertas</h2>
            {alertas.map((alerta, idx) => (
              <AlertBox key={idx} type="warning" message={alerta.mensaje} />
            ))}
          </section>
        )}

        <div className={styles.actions}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            Ir al Dashboard
          </button>
          <button className={styles.editBtn} onClick={() => navigate(`/quotes/${folio}/general-info`)}>
            Editar Cotización
          </button>
        </div>
      </main>
    </div>
  );
}
