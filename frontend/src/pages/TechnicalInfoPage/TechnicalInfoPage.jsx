import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCoberturas } from '../../hooks/useCoberturas';
import { useCalculo } from '../../hooks/useCalculo';
import HeaderNav from '../../components/HeaderNav';
import ProgressBar from '../../components/ProgressBar';
import AlertBox from '../../components/AlertBox';
import LoadingSpinner from '../../components/LoadingSpinner';
import CoverageCheckbox from '../../components/CoverageCheckbox';
import PriceBreakdown from '../../components/PriceBreakdown';
import styles from './TechnicalInfoPage.module.css';

export default function TechnicalInfoPage() {
  const { folio } = useParams();
  const navigate = useNavigate();
  const { coberturas, loading: loadingCob, error: errorCob, cargar, actualizar } = useCoberturas(folio);
  const { primaNeta, primaComercial, desglose, alertas, loading: loadingCalc, error: errorCalc, calcular } = useCalculo(folio);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleToggle = async (cobertura) => {
    if (cobertura.obligatoria) return;
    const updated = coberturas.map(c =>
      c.cobertura === cobertura.cobertura
        ? { cobertura: c.cobertura, activa: !c.activa }
        : { cobertura: c.cobertura, activa: c.activa }
    );
    await actualizar(updated);
  };

  const handleCalcular = async () => {
    await calcular();
  };

  return (
    <div className={styles.page}>
      <HeaderNav folio={folio} />
      <ProgressBar currentStep={3} />

      <main className={styles.main}>
        <h1 className={styles.title}>Información Técnica y Coberturas</h1>

        {(errorCob || errorCalc) && (
          <AlertBox type="error" message={errorCob || errorCalc} />
        )}

        {/* Coberturas */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Seleccionar Coberturas</h2>
          {loadingCob ? (
            <LoadingSpinner message="Cargando coberturas..." />
          ) : (
            coberturas.map(cob => (
              <CoverageCheckbox
                key={cob.cobertura}
                coverage={cob}
                checked={cob.activa}
                onChange={() => handleToggle(cob)}
              />
            ))
          )}
        </section>

        {/* Cálculo */}
        <section className={styles.section}>
          <button
            className={styles.calcBtn}
            onClick={handleCalcular}
            disabled={loadingCalc}
          >
            {loadingCalc ? 'Calculando...' : 'Calcular Prima'}
          </button>

          {alertas.length > 0 && alertas.map((a, i) => (
            <AlertBox key={i} type="warning" message={a.mensaje} />
          ))}

          <PriceBreakdown
            primaNeta={primaNeta}
            primaComercial={primaComercial}
            desglose={desglose}
          />
        </section>

        <div className={styles.pageActions}>
          <button
            className={styles.backBtn}
            onClick={() => navigate(`/quotes/${folio}/locations`)}
          >
            Atrás
          </button>
          <button
            className={styles.nextBtn}
            onClick={() => navigate(`/quotes/${folio}/terms-and-conditions`, { state: { primaNeta, primaComercial } })}
          >
            Términos y Confirmación
          </button>
        </div>
      </main>
    </div>
  );
}
