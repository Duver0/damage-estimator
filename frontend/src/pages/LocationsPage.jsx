import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUbicaciones } from '../hooks/useUbicaciones';
import { useCatalogos } from '../hooks/useCatalogos';
import HeaderNav from '../components/HeaderNav';
import ProgressBar from '../components/ProgressBar';
import AlertBox from '../components/AlertBox';
import LoadingSpinner from '../components/LoadingSpinner';
import LocationCard from '../components/LocationCard';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import styles from './LocationsPage.module.css';

const UBICACION_VACIA = {
  nombre_ubicacion: '',
  direccion: '',
  codigo_postal: '',
  estado: '',
  municipio: '',
  colonia: '',
  ciudad: '',
  tipo_constructivo: 'LADRILLO_CONCRETO',
  nivel: 1,
  anio_construccion: 2010,
  giro: { clave_giro: '', clave_incendio: '', descripcion: '' },
  garantias: [],
};

export default function LocationsPage() {
  const { folio } = useParams();
  const navigate = useNavigate();
  const {
    ubicaciones, version, loading, error,
    cargarUbicaciones, setLayout, agregarUbicacion, editarUbicacion,
  } = useUbicaciones(folio);
  const { giros, garantias, tiposConstructivos, cargarCatalogos, validarCP, error: errorCatalogos } = useCatalogos();

  const [cantidadLayout, setCantidadLayout] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formUbicacion, setFormUbicacion] = useState({ ...UBICACION_VACIA });
  const [formErrors, setFormErrors] = useState({});
  const [cpInfo, setCpInfo] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    cargarUbicaciones();
    cargarCatalogos();
  }, [cargarUbicaciones, cargarCatalogos]);

  const handleLayoutChange = async () => {
    try {
      await setLayout(cantidadLayout);
      setSuccessMsg(`Layout configurado: ${cantidadLayout} ubicaciones`);
    } catch {
      // error manejado en el hook
    }
  };

  const handleCPBlur = async (cp) => {
    if (!cp) return;
    try {
      const info = await validarCP(cp);
      setCpInfo(info);
      if (info) {
        setFormUbicacion(prev => ({
          ...prev,
          estado: info.estado || '',
          municipio: info.municipio || '',
          colonia: info.colonia || '',
          ciudad: info.ciudad || '',
        }));
        setFormErrors(prev => ({ ...prev, codigo_postal: '' }));
      }
    } catch (err) {
      setCpInfo(null);
      setFormErrors(prev => ({ ...prev, codigo_postal: err.message }));
    }
  };

  const handleGiroChange = (e) => {
    const claveGiro = e.target.value;
    const giroInfo = giros.find(g => g.clave_giro === claveGiro);
    setFormUbicacion(prev => ({
      ...prev,
      giro: {
        clave_giro: claveGiro,
        clave_incendio: giroInfo?.clave_incendio || '',
        descripcion: giroInfo?.descripcion || '',
      },
    }));
  };

  const handleGarantiaToggle = (garantia) => {
    setFormUbicacion(prev => {
      const existing = prev.garantias.find(g => g.codigo_garantia === garantia.codigo_garantia);
      if (existing) {
        return { ...prev, garantias: prev.garantias.filter(g => g.codigo_garantia !== garantia.codigo_garantia) };
      }
      const sumaDefault = garantia.codigo_garantia.startsWith('INCENDIO_CONTENIDOS') ? 10000000 : 50000000;
      return {
        ...prev,
        garantias: [...prev.garantias, {
          codigo_garantia: garantia.codigo_garantia,
          nombre: garantia.nombre,
          suma_asegurada: sumaDefault,
        }],
      };
    });
  };

  const handleEdit = (indice) => {
    const ub = ubicaciones.find(u => u.indice === indice) || {};
    setFormUbicacion({ ...UBICACION_VACIA, ...ub });
    setCpInfo(ub.codigo_postal ? { estado: ub.estado, municipio: ub.municipio, es_zona_cat: ub.zona_catastrofica } : null);
    setEditingIndex(indice);
    setFormErrors({});
    setShowForm(true);
  };

  const handleSumaAseguradaChange = (codigoGarantia, valor) => {
    setFormUbicacion(prev => ({
      ...prev,
      garantias: prev.garantias.map(g =>
        g.codigo_garantia === codigoGarantia
          ? { ...g, suma_asegurada: Number(valor) || 0 }
          : g
      ),
    }));
  };

  const handleGuardarUbicacion = async () => {
    const errors = {};
    if (!formUbicacion.nombre_ubicacion) errors.nombre_ubicacion = 'Nombre requerido';
    if (!formUbicacion.codigo_postal) errors.codigo_postal = 'CP requerido';
    if (!cpInfo) errors.codigo_postal = 'CP debe ser validado';
    if (!formUbicacion.giro.clave_giro) errors.giro = 'Giro requerido';
    if (formUbicacion.garantias.length === 0) errors.garantias = 'Al menos una garantía requerida';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      if (editingIndex !== null) {
        await editarUbicacion(editingIndex, formUbicacion);
        await cargarUbicaciones();
        setSuccessMsg('Ubicación actualizada correctamente');
      } else {
        const nuevasUbicaciones = [...ubicaciones, formUbicacion];
        await agregarUbicacion(nuevasUbicaciones);
        setSuccessMsg('Ubicación guardada correctamente');
      }
      setFormUbicacion({ ...UBICACION_VACIA });
      setCpInfo(null);
      setEditingIndex(null);
      setShowForm(false);
    } catch {
      // error manejado en el hook
    }
  };

  return (
    <div className={styles.page}>
      <HeaderNav folio={folio} />
      <ProgressBar currentStep={2} />

      <main className={styles.main}>
        <h1 className={styles.title}>Ubicaciones de Riesgo</h1>

        {error && <AlertBox type="error" message={error} />}
        {errorCatalogos && <AlertBox type="error" message={`Error al cargar catálogos: ${errorCatalogos}`} />}
        {successMsg && <AlertBox type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

        {/* Layout */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Cantidad de ubicaciones a asegurar</h2>
          <div className={styles.layoutRow}>
            <InputField
              label="Cantidad de ubicaciones"
              name="cantidad"
              type="number"
              value={cantidadLayout}
              onChange={e => setCantidadLayout(Number(e.target.value))}
            />
            <button className={styles.actionBtn} onClick={handleLayoutChange}>
              Guardar Layout
            </button>
          </div>
        </section>

        {/* Ubicaciones capturadas */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Ubicaciones registradas ({ubicaciones.length})
          </h2>

          {loading && <LoadingSpinner message="Cargando..." />}

          {ubicaciones.map((ub) => (
            <LocationCard
              key={ub.indice}
              location={ub}
              index={ub.indice}
              isComplete={ub.estado_validacion === 'COMPLETA'}
              onEdit={() => handleEdit(ub.indice)}
            />
          ))}

          {!showForm && (
            <button
              className={styles.addBtn}
              onClick={() => setShowForm(true)}
            >
              + Agregar Ubicación
            </button>
          )}
        </section>

        {/* Formulario nueva ubicación */}
        {showForm && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{editingIndex !== null ? `Editar Ubicación ${editingIndex + 1}` : 'Nueva Ubicación'}</h2>

            <InputField
              label="Nombre de la ubicación"
              name="nombre_ubicacion"
              value={formUbicacion.nombre_ubicacion}
              onChange={e => setFormUbicacion(prev => ({ ...prev, nombre_ubicacion: e.target.value }))}
              error={formErrors.nombre_ubicacion}
              required
            />
            <InputField
              label="Dirección"
              name="direccion"
              value={formUbicacion.direccion}
              onChange={e => setFormUbicacion(prev => ({ ...prev, direccion: e.target.value }))}
            />
            <InputField
              label="Código Postal"
              name="codigo_postal"
              value={formUbicacion.codigo_postal}
              onChange={e => setFormUbicacion(prev => ({ ...prev, codigo_postal: e.target.value }))}
              onBlur={e => handleCPBlur(e.target.value)}
              error={formErrors.codigo_postal}
              placeholder="Ej. 110111"
              required
            />
            {cpInfo && (
              <AlertBox
                type="success"
                message={`CP válido: ${cpInfo.estado}, ${cpInfo.municipio}${cpInfo.es_zona_cat ? ' - ZONA CAT' : ''}`}
              />
            )}

            <SelectField
              label="Giro de Negocio"
              name="giro"
              value={formUbicacion.giro.clave_giro}
              onChange={handleGiroChange}
              options={giros.map(g => ({ value: g.clave_giro, label: g.descripcion }))}
              error={formErrors.giro}
              required
            />

            <SelectField
              label="Tipo Constructivo"
              name="tipo_constructivo"
              value={formUbicacion.tipo_constructivo}
              onChange={e => setFormUbicacion(prev => ({ ...prev, tipo_constructivo: e.target.value }))}
              options={tiposConstructivos}
            />

            <InputField
              label="Año de Construcción"
              name="anio_construccion"
              type="number"
              value={formUbicacion.anio_construccion}
              onChange={e => setFormUbicacion(prev => ({ ...prev, anio_construccion: Number(e.target.value) }))}
            />

            <div className={styles.garantiasSection}>
              <p className={styles.garantiasLabel}>
                Garantías {formErrors.garantias && <span className={styles.errorText}>{formErrors.garantias}</span>}
              </p>
              {garantias.map(g => {
                const seleccionada = formUbicacion.garantias.find(sel => sel.codigo_garantia === g.codigo_garantia);
                return (
                  <div key={g.codigo_garantia} className={styles.garantiaRow}>
                    <label className={styles.garantiaCheck}>
                      <input
                        type="checkbox"
                        checked={!!seleccionada}
                        onChange={() => handleGarantiaToggle(g)}
                      />
                      <span>{g.nombre}</span>
                    </label>
                    {seleccionada && (
                      <div className={styles.sumaAseguradaField}>
                        <label className={styles.sumaLabel}>Suma Asegurada (COP)</label>
                        <input
                          type="number"
                          className={styles.sumaInput}
                          value={seleccionada.suma_asegurada}
                          min={10000000}
                          step={1000000}
                          onChange={e => handleSumaAseguradaChange(g.codigo_garantia, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={styles.formActions}>
              <button className={styles.cancelBtn} onClick={() => { setShowForm(false); setEditingIndex(null); setFormUbicacion({ ...UBICACION_VACIA }); setCpInfo(null); }}>
                Cancelar
              </button>
              <button className={styles.saveBtn} onClick={handleGuardarUbicacion}>
                Guardar Ubicación
              </button>
            </div>
          </section>
        )}

        <div className={styles.pageActions}>
          <button
            className={styles.backBtn}
            onClick={() => navigate(`/quotes/${folio}/general-info`)}
          >
            Atrás
          </button>
          <button
            className={styles.nextBtn}
            disabled={ubicaciones.length === 0}
            title={ubicaciones.length === 0 ? 'Agrega al menos una ubicación para continuar' : ''}
            onClick={() => {
              if (ubicaciones.length === 0) return;
              navigate(`/quotes/${folio}/technical-info`);
            }}
          >
            Siguiente
          </button>
        </div>
      </main>
    </div>
  );
}
