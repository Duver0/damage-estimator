import { useNavigate, Link } from 'react-router-dom';
import styles from './HeaderNav.module.css';

export default function HeaderNav({ folio, onBack }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.backBtn} onClick={handleBack} aria-label="Volver">
          &#8592; Atrás
        </button>
        <Link to="/dashboard" className={styles.dashboardLink}>
          Dashboard
        </Link>
      </div>
      <div className={styles.center}>
        <span className={styles.title}>Cotizador de Daños</span>
        {folio && <span className={styles.folio}>Folio: {folio}</span>}
      </div>
      <div className={styles.right}>
        <button
          className={styles.homeBtn}
          onClick={() => navigate('/cotizador')}
          aria-label="Inicio"
        >
          🏠 Inicio
        </button>
      </div>
    </header>
  );
}
