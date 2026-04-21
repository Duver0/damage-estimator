import { useState, useCallback } from 'react';
import { obtenerGeneralInfo, actualizarGeneralInfo } from '../services/generalInfoService';

/**
 * Hook: estado y operaciones de datos generales.
 */
export function useGeneralInfo(folio) {
  const [datosAsegurado, setDatosAsegurado] = useState(null);
  const [datosConduccion, setDatosConduccion] = useState(null);
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    if (!folio) return;
    setLoading(true);
    setError(null);
    try {
      const result = await obtenerGeneralInfo(folio);
      setDatosAsegurado(result.datos_asegurado);
      setDatosConduccion(result.datos_conduccion);
      setVersion(result.version);
      return result;
    } catch (err) {
      const detail = err.response?.data?.detail;
      let msg;
      if (Array.isArray(detail)) {
        msg = detail.map(e => e.msg).join(', ');
      } else if (typeof detail === 'object' && detail !== null) {
        msg = detail.message || JSON.stringify(detail);
      } else {
        msg = detail || 'Error al cargar datos generales';
      }
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [folio]);

  const guardar = useCallback(async (payload) => {
    if (!folio) return;
    setLoading(true);
    setError(null);
    try {
      const result = await actualizarGeneralInfo(folio, { ...payload, version: version ?? 1 });
      setDatosAsegurado(result.datos_asegurado);
      setDatosConduccion(result.datos_conduccion);
      setVersion(result.version);
      return result;
    } catch (err) {
      const detail = err.response?.data?.detail;
      let msg;
      if (Array.isArray(detail)) {
        msg = detail.map(e => e.msg).join(', ');
      } else if (typeof detail === 'object' && detail !== null) {
        msg = detail.message || JSON.stringify(detail);
      } else {
        msg = detail || 'Error al guardar datos generales';
      }
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [folio, version]);

  return { datosAsegurado, datosConduccion, version, loading, error, cargar, guardar };
}
