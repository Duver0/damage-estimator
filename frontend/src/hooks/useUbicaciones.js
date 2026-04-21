import { useState, useCallback } from 'react';
import {
  setLayout as apiSetLayout,
  getLayout as apiGetLayout,
  agregarUbicaciones,
  obtenerUbicaciones,
  editarUbicacion as apiEditarUbicacion,
  obtenerResumen,
} from '../services/ubicacionesService';

/**
 * Hook: estado y operaciones de ubicaciones.
 */
export function useUbicaciones(folio) {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [layout, setLayoutState] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarUbicaciones = useCallback(async () => {
    if (!folio) return;
    setLoading(true);
    setError(null);
    try {
      const result = await obtenerUbicaciones(folio);
      setUbicaciones(result.ubicaciones || []);
      setVersion(result.version);
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al cargar ubicaciones';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [folio]);

  const setLayout = useCallback(async (cantidad) => {
    if (!folio) return;
    if (version === null) {
      setError('No se puede configurar el layout: datos no cargados. Recarga la página.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await apiSetLayout(folio, cantidad, version);
      setLayoutState(result.configuracion_layout);
      setVersion(result.version);
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al configurar layout';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [folio, version]);

  const agregarUbicacion = useCallback(async (nuevasUbicaciones) => {
    if (!folio) return;
    if (version === null) {
      setError('No se puede agregar ubicaciones: datos no cargados. Recarga la página.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await agregarUbicaciones(folio, nuevasUbicaciones, version);
      setUbicaciones(result.ubicaciones || []);
      setVersion(result.version);
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al agregar ubicaciones';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [folio, version]);

  const editarUbicacion = useCallback(async (indice, datos) => {
    if (!folio) return;
    if (version === null) {
      setError('No se puede editar ubicaciones: datos no cargados. Recarga la página.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await apiEditarUbicacion(folio, indice, datos, version);
      // Actualizar ubicación en el array local
      setUbicaciones(prev => prev.map(u => u.indice === indice ? result : u));
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al editar ubicación';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [folio, version]);

  const getResumen = useCallback(async () => {
    if (!folio) return;
    setLoading(true);
    setError(null);
    try {
      const result = await obtenerResumen(folio);
      setResumen(result);
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al obtener resumen';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [folio]);

  return {
    ubicaciones,
    layout,
    resumen,
    version,
    loading,
    error,
    cargarUbicaciones,
    setLayout,
    agregarUbicacion,
    editarUbicacion,
    getResumen,
  };
}
