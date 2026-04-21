import { useState, useCallback } from 'react';
import { obtenerAgentes } from '../services/catalogosService';

/**
 * Hook: búsqueda y listado de agentes.
 */
export function useAgentes() {
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await obtenerAgentes();
      setAgentes(result);
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al cargar agentes';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const buscar = useCallback((query) => {
    if (!query) return agentes;
    const q = query.toLowerCase();
    return agentes.filter(
      a => a.nombre?.toLowerCase().includes(q) || a.codigo?.toLowerCase().includes(q)
    );
  }, [agentes]);

  return { agentes, loading, error, cargar, buscar };
}
