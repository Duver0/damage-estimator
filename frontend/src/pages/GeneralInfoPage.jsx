import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGeneralInfo } from '../hooks/useGeneralInfo';
import HeaderNav from '../components/HeaderNav';
import ProgressBar from '../components/ProgressBar';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import AlertBox from '../components/AlertBox';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from './GeneralInfoPage.module.css';

const TIPOS_NEGOCIO = [
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'RESIDENCIAL', label: 'Residencial' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'SERVICIOS', label: 'Servicios' },
];

const TIPOS_ID = [
  { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
  { value: 'NIT', label: 'NIT (Persona Jurídica)' },
  { value: 'CE', label: 'Cédula de Extranjería (CE)' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
];

export default function GeneralInfoPage() {
  const { folio } = useParams();
  const navigate = useNavigate();
  const { datosAsegurado, datosConduccion, loading, error, cargar, guardar } = useGeneralInfo(folio);

  const [form, setForm] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    tipoIdentificacion: 'CC',
    numeroIdentificacion: '',
    codigoAgente: '',
    tipoNegocio: 'COMERCIAL',
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const TIPO_ID_LEGACY_MAP = { RFC: 'CC', CURP: 'CC' };

  useEffect(() => {
    cargar().then((data) => {
      if (data) {
        const a = data.datos_asegurado || {};
        const c = data.datos_conduccion || {};
        setForm({
          nombre: a.nombre || '',
          apellidos: a.apellidos || '',
          email: a.email || '',
          telefono: a.telefono || '',
          tipoIdentificacion: TIPO_ID_LEGACY_MAP[a.tipo_identificacion] || a.tipo_identificacion || 'CC',
          numeroIdentificacion: a.numero_identificacion || '',
          codigoAgente: c.codigo_agente || '',
          tipoNegocio: data.tipo_negocio || 'COMERCIAL',
        });
      }
    }).catch(() => {});
  }, [cargar]);

  const validate = () => {
    const errors = {};
    if (!form.nombre.trim()) errors.nombre = 'Nombre es requerido';
    if (!form.codigoAgente.trim()) errors.codigoAgente = 'Código de agente es requerido';
    return errors;
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFormErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    try {
      await guardar({
        datos_asegurado: {
          nombre: form.nombre,
          apellidos: form.apellidos,
          email: form.email,
          telefono: form.telefono,
          tipo_identificacion: form.tipoIdentificacion,
          numero_identificacion: form.numeroIdentificacion,
        },
        datos_conduccion: {
          codigo_agente: form.codigoAgente,
        },
        tipo_negocio: form.tipoNegocio,
      });
      setSuccessMsg('Datos guardados correctamente');
      setTimeout(() => navigate(`/quotes/${folio}/locations`), 800);
    } catch {
      // error manejado en el hook
    }
  };

  if (loading && !datosAsegurado) return <LoadingSpinner message="Cargando datos..." />;

  return (
    <div className={styles.page}>
      <HeaderNav folio={folio} />
      <ProgressBar currentStep={1} />

      <main className={styles.main}>
        <h1 className={styles.title}>Datos Generales</h1>

        {error && <AlertBox type="error" message={error} />}
        {successMsg && <AlertBox type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

        <form onSubmit={handleSubmit} noValidate>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Datos del Asegurado</h2>
            <InputField
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              error={formErrors.nombre}
              required
            />
            <InputField
              label="Apellidos"
              name="apellidos"
              value={form.apellidos}
              onChange={handleChange}
            />
            <InputField
              label="Correo Electrónico"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={formErrors.email}
            />
            <InputField
              label="Teléfono"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
            />
            <SelectField
              label="Tipo de Identificación"
              name="tipoIdentificacion"
              value={form.tipoIdentificacion}
              onChange={handleChange}
              options={TIPOS_ID}
            />
            <InputField
              label="Número de Identificación"
              name="numeroIdentificacion"
              value={form.numeroIdentificacion}
              onChange={handleChange}
            />
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Datos de Conducción</h2>
            <InputField
              label="Código de Agente"
              name="codigoAgente"
              value={form.codigoAgente}
              onChange={handleChange}
              error={formErrors.codigoAgente}
              placeholder="Ej. AG001"
              required
            />
            <SelectField
              label="Tipo de Negocio"
              name="tipoNegocio"
              value={form.tipoNegocio}
              onChange={handleChange}
              options={TIPOS_NEGOCIO}
            />
          </section>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate('/cotizador')}
            >
              Atrás
            </button>
            <button
              type="submit"
              className={styles.nextBtn}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Siguiente'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
