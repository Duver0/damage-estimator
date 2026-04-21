import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCotizacion } from '../hooks/useCotizacion';
import { listarCotizaciones } from '../services/cotizacionService';
import InputField from '../components/InputField';
import AlertBox from '../components/AlertBox';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from './CotizadorPage.module.css';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' });

export default function CotizadorPage() {
  const navigate = useNavigate();
  const { crear, abrirFolioExistente, loading, error } = useCotizacion();

  // Formulario nuevo folio
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    codigoAgente: 'AG001',
    tipoNegocio: 'COMERCIAL',
  });
  const [formErrors, setFormErrors] = useState({});

  // Folio existente
  const [folioExistente, setFolioExistente] = useState('');
  const [folioError, setFolioError] = useState('');

  // Dashboard
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loadingCotizaciones, setLoadingCotizaciones] = useState(true);
  const [errorCotizaciones, setErrorCotizaciones] = useState(null);

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  const cargarCotizaciones = async () => {
    try {
      const datos = await listarCotizaciones();
      setCotizaciones(datos);
      setErrorCotizaciones(null);
    } catch {
      setErrorCotizaciones('No se pudo cargar cotizaciones');
    } finally {
      setLoadingCotizaciones(false);
    }
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFormErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errors = {};
    if (!form.nombre.trim()) errors.nombre = 'Nombre es requerido';
    if (!form.email.trim()) errors.email = 'Email es requerido';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Email inválido';
    if (!form.codigoAgente.trim()) errors.codigoAgente = 'Agente es requerido';
    return errors;
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    try {
      const result = await crear({
        datos_asegurado: {
          nombre: form.nombre,
          email: form.email,
        },
        datos_conduccion: {
          codigo_agente: form.codigoAgente,
        },
        tipo_negocio: form.tipoNegocio,
      });
      navigate(`/quotes/${result.numero_folio}/general-info`);
    } catch {
      // error manejado en el hook
    }
  };

  const handleAbrir = (e) => {
    e.preventDefault();
    if (!folioExistente.trim()) {
      setFolioError('Ingresa un número de folio');
      return;
    }
    abrirFolioExistente(folioExistente.trim().toUpperCase());
    navigate(`/quotes/${folioExistente.trim().toUpperCase()}/general-info`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Cotizador de Daños</h1>
        <p className={styles.subtitle}>Sistema de cotización de seguros</p>
      </header>

      <main className={styles.main}>
        {error && <AlertBox type="error" message={error} />}

        <div className={styles.container}>
          {/* IZQUIERDA: Formularios */}
          <div className={styles.leftPanel}>
            {/* Sección: Crear folio nuevo */}
            <section className={styles.section} aria-labelledby="crear-title">
              <h2 id="crear-title" className={styles.sectionTitle}>Crear Folio Nuevo</h2>
              <form onSubmit={handleCrear} noValidate>
                <InputField
                  label="Nombre del Asegurado"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  error={formErrors.nombre}
                  placeholder="Ej. Juan Pérez López"
                  required
                />
                <InputField
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  error={formErrors.email}
                  placeholder="juan@example.com"
                  required
                />
                <InputField
                  label="Código de Agente"
                  name="codigoAgente"
                  value={form.codigoAgente}
                  onChange={handleChange}
                  error={formErrors.codigoAgente}
                  placeholder="AG001"
                  required
                />
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={loading}
                >
                  {loading ? 'Creando...' : 'Crear Folio'}
                </button>
              </form>
              {loading && <LoadingSpinner message="Creando cotización..." />}
            </section>

            <div className={styles.divider}>
              <span>— O ABRE UNO EXISTENTE —</span>
            </div>

            {/* Sección: Abrir folio existente */}
            <section className={styles.section} aria-labelledby="abrir-title">
              <h2 id="abrir-title" className={styles.sectionTitle}>Abrir Folio Existente</h2>
              <form onSubmit={handleAbrir}>
                <InputField
                  label="Número de Folio"
                  name="folioExistente"
                  value={folioExistente}
                  onChange={e => { setFolioExistente(e.target.value); setFolioError(''); }}
                  error={folioError}
                  placeholder="Ej. F2026041700001"
                />
                <button type="submit" className={styles.secondaryBtn}>
                  Abrir
                </button>
              </form>
            </section>
          </div>

          {/* DERECHA: Dashboard */}
          <div className={styles.rightPanel}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Cotizaciones Recientes</h2>

              {errorCotizaciones && <AlertBox type="error" message={errorCotizaciones} />}
              {loadingCotizaciones && <LoadingSpinner message="Cargando..." />}

              {!loadingCotizaciones && cotizaciones.length === 0 && (
                <p className={styles.emptyMessage}>Sin cotizaciones aún</p>
              )}

              {!loadingCotizaciones && cotizaciones.length > 0 && (
                <>
                  <div className={styles.cotizacionesList}>
                    {cotizaciones.slice(0, 5).map((cot) => (
                      <div
                        key={cot.numero_folio}
                        className={styles.cotizacionCard}
                      >
                        <div
                          className={styles.cardContent}
                          onClick={() => navigate(`/quotes/${cot.numero_folio}/view`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className={styles.cardHeader}>
                            <span className={styles.folio}>{cot.numero_folio}</span>
                            <span className={`${styles.badge} ${styles[`badge-${cot.estado_cotizacion.toLowerCase()}`]}`}>
                              {cot.estado_cotizacion}
                            </span>
                          </div>
                          <p className={styles.cardAsegurado}>{cot.nombre_asegurado}</p>
                          {cot.prima_neta && (
                            <p className={styles.cardPrima}>{COP.format(cot.prima_neta)}</p>
                          )}
                          <p className={styles.cardDate}>
                            {new Date(cot.fecha_ultima_actualizacion).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
