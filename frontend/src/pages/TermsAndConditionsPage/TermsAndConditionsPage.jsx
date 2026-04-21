import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import HeaderNav from '../../components/HeaderNav';
import ProgressBar from '../../components/ProgressBar';
import styles from './TermsAndConditionsPage.module.css';

function formatMXN(value) {
  if (value == null) return '—';
  return Number(value).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function TermsAndConditionsPage() {
  const { folio } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const primaNeta = state?.primaNeta;
  const primaComercial = state?.primaComercial;
  const [accepted, setAccepted] = useState(false);

  return (
    <div className={styles.page}>
      <HeaderNav folio={folio} />
      <ProgressBar currentStep={4} />

      <main className={styles.main}>
        <h1 className={styles.title}>Términos y Confirmación</h1>

        {/* Prima summary card */}
        {(primaNeta != null || primaComercial != null) && (
          <div className={styles.summaryCard}>
            <p className={styles.summaryTitle}>Resumen Financiero</p>

            {primaNeta != null && (
              <div className={styles.primaRow}>
                <span className={styles.resultLabel}>Prima Neta</span>
                <strong className={styles.resultValue}>
                  <span className={styles.currency}>$</span>
                  {formatMXN(primaNeta)}
                </strong>
              </div>
            )}

            {primaComercial != null && (
              <div className={styles.heroRow}>
                <span className={styles.heroLabel}>Prima Comercial Total</span>
                <span className={styles.heroAmount}>
                  <span className={styles.currency}>$</span>
                  <strong className={styles.resultValue}>{formatMXN(primaComercial)}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Terms */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Condiciones de la Póliza</h2>
          <div className={styles.termsBox}>
            <p>
              Al confirmar esta cotización, el asegurado declara que la información
              proporcionada es verídica y que autoriza al agente designado a gestionar
              la emisión de la póliza correspondiente.
            </p>
            <p>
              La prima calculada es una estimación basada en los datos capturados.
              El valor definitivo podrá ajustarse durante el proceso de emisión conforme
              a las tarifas vigentes y la inspección de riesgo aplicable.
            </p>
            <p>
              Las coberturas seleccionadas quedarán sujetas a las exclusiones y
              condiciones generales del contrato de seguro emitido por la aseguradora.
            </p>
            <p>
              La vigencia de esta cotización es de 30 días calendario a partir de
              la fecha de cálculo. Transcurrido este plazo deberá recalcularse.
            </p>
          </div>

          <label className={styles.acceptRow}>
            <input
              type="checkbox"
              className={styles.acceptCheckbox}
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
            />
            <span className={styles.acceptLabel}>
              He leído y acepto los términos y condiciones de esta cotización, y
              autorizo el procesamiento de los datos capturados.
            </span>
          </label>
        </section>

        <div className={styles.actions}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            Atrás
          </button>
          <button
            className={styles.confirmBtn}
            disabled={!accepted}
            onClick={() => navigate(`/quotes/${folio}/view`)}
          >
            Confirmar Cotización
          </button>
        </div>
      </main>
    </div>
  );
}
