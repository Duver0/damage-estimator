import { useState, useCallback } from 'react';
import { crearCotizacion, obtenerEstado } from '../services/cotizacionService';
import { useCotizacionContext } from '../contexts/CotizacionContext';

/**
 * Hook: estado general de cotización.
 * Crea, carga y expone el folio activo.
 */
export function useCotizacion() {
  const { folio, setFolio } = useCotizacionContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [datos, setDatos] = useState(null);

  const crear = useCallback(async (datosForm, idempotencyKey = null) => {
    setLoading(true);
    setError(null);
    try {
      const result = await crearCotizacion(datosForm, idempotencyKey);
      setFolio(result.numero_folio);
      setDatos(result);
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al crear cotización';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setFolio]);

  const getState = useCallback(async (folioParam) => {
    const targetFolio = folioParam || folio;
    if (!targetFolio) return null;
    setLoading(true);
    setError(null);
    try {
      const result = await obtenerEstado(targetFolio);
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al obtener estado';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [folio]);

  const abrirFolioExistente = useCallback((numeroFolio) => {
    setFolio(numeroFolio);
  }, [setFolio]);

  return { folio, datos, loading, error, crear, getState, abrirFolioExistente };
}
