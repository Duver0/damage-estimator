import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarCotizaciones, crearCotizacion, eliminarCotizacion } from '../../services/cotizacionService';
import HeaderNav from '../../components/HeaderNav';
import AlertBox from '../../components/AlertBox';
import LoadingSpinner from '../../components/LoadingSpinner';
import styles from './DashboardPage.module.css';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' });

export default function DashboardPage() {
  const navigate = useNavigate();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creando, setCreando] = useState(false);
  const [deletingFolio, setDeletingFolio] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  async function cargarCotizaciones() {
    setLoading(true);
    try {
      const datos = await listarCotizaciones();
      setCotizaciones(datos);
    } catch (err) {
      setError('No se pudo cargar las cotizaciones');
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminar(folio) {
    if (!window.confirm(`¿Eliminar cotización ${folio}?`)) return;
    setDeletingFolio(folio);
    try {
      await eliminarCotizacion(folio);
      await cargarCotizaciones();
      setDeleteError(null);
    } catch {
      setDeleteError('Error al eliminar la cotización');
    } finally {
      setDeletingFolio(null);
    }
  }

  async function crearNueva() {
    setCreando(true);
    try {
      const resultado = await crearCotizacion({
        datos_asegurado: { nombre: 'Nueva Cotización' },
        datos_conduccion: { codigo_agente: 'AG001' },
        tipo_negocio: 'COMERCIAL',
      });
      navigate(`/quotes/${resultado.numero_folio}/general-info`);
    } catch (err) {
      setError('No se pudo crear la cotización');
      setCreando(false);
    }
  }

  return (
    <div className={styles.page}>
      <HeaderNav />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Dashboard de Cotizaciones</h1>
          <button
            className={styles.newBtn}
            onClick={crearNueva}
            disabled={creando}
          >
            {creando ? 'Creando...' : '+ Nueva Cotización'}
          </button>
        </div>

        {error && <AlertBox type="error" message={error} />}
        {deleteError && <AlertBox type="error" message={deleteError} />}
        {loading && <LoadingSpinner message="Cargando cotizaciones..." />}

        {!loading && cotizaciones.length === 0 && (
          <AlertBox type="info" message="No hay cotizaciones aún. Crea una nueva para comenzar." />
        )}

        {!loading && cotizaciones.length > 0 && (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.colFolio}>Folio</div>
              <div className={styles.colAsegurado}>Asegurado</div>
              <div className={styles.colEstado}>Estado</div>
              <div className={styles.colPrima}>Prima Neta</div>
              <div className={styles.colFecha}>Última Actualización</div>
              <div className={styles.colAcciones}>Acciones</div>
            </div>

            {cotizaciones.map((cot) => (
              <div key={cot.numero_folio} className={styles.tableRow}>
                <div className={styles.colFolio}>{cot.numero_folio}</div>
                <div className={styles.colAsegurado}>{cot.nombre_asegurado}</div>
                <div className={styles.colEstado}>
                  <span className={`${styles.badge} ${styles[`badge-${cot.estado_cotizacion.toLowerCase()}`]}`}>
                    {cot.estado_cotizacion}
                  </span>
                </div>
                <div className={styles.colPrima}>
                  {cot.prima_neta ? COP.format(cot.prima_neta) : '-'}
                </div>
                <div className={styles.colFecha}>
                  {new Date(cot.fecha_ultima_actualizacion).toLocaleDateString('es-CO')}
                </div>
                <div className={styles.colAcciones}>
                  <button
                    className={styles.viewBtn}
                    onClick={() => navigate(`/quotes/${cot.numero_folio}/view`)}
                  >
                    Ver
                  </button>
                  <button
                    className={styles.editBtn}
                    onClick={() => navigate(`/quotes/${cot.numero_folio}/general-info`)}
                  >
                    Editar
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleEliminar(cot.numero_folio)}
                    disabled={deletingFolio === cot.numero_folio}
                  >
                    {deletingFolio === cot.numero_folio ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
