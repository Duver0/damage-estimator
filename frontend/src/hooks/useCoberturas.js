import { useState, useCallback } from 'react';
import { obtenerCoberturas, actualizarCoberturas } from '../services/coberturasService';

/**
 * Hook: estado y operaciones de coberturas.
 */
export function useCoberturas(folio) {
  const [coberturas, setCoberturas] = useState([]);
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    if (!folio) return;
    setLoading(true);
    setError(null);
    try {
      const result = await obtenerCoberturas(folio);
      setCoberturas(result.opciones_cobertura || []);
      setVersion(result.version);
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al cargar coberturas';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [folio]);

  const actualizar = useCallback(async (nuevasCoberturas) => {
    if (!folio || version === null) return;
    setLoading(true);
    setError(null);
    try {
      const result = await actualizarCoberturas(folio, nuevasCoberturas, version);
      setCoberturas(result.opciones_cobertura || []);
      setVersion(result.version);
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al actualizar coberturas';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [folio, version]);

  return { coberturas, version, loading, error, cargar, actualizar };
}
