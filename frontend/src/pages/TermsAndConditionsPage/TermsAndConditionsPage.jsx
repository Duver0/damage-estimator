import { useParams, useNavigate } from 'react-router-dom';
import HeaderNav from '../../components/HeaderNav';
import styles from './TermsAndConditionsPage.module.css';

export default function TermsAndConditionsPage() {
  const { folio } = useParams();
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <HeaderNav folio={folio} />
      <main className={styles.main}>
        <h1 className={styles.title}>Términos y Condiciones</h1>
        <p className={styles.text}>
          Aquí van los términos y condiciones del cotizador. Este texto es
          de ejemplo; reemplácelo con el contenido real si está disponible.
        </p>
        <div className={styles.actions}>
          <button className={styles.btn} onClick={() => navigate(`/quotes/${folio}/view`)}>
            Volver
          </button>
        </div>
      </main>
    </div>
  );
}
