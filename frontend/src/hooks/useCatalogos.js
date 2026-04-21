import { useState, useCallback } from 'react';
import { obtenerGiros, obtenerGarantias, validarCodigoPostal } from '../services/catalogosService';

const TIPOS_CONSTRUCTIVOS = [
  { value: 'LADRILLO_CONCRETO', label: 'Ladrillo / Concreto' },
  { value: 'ACERO', label: 'Estructura de Acero' },
  { value: 'MADERA', label: 'Madera' },
  { value: 'HORMIGON_ARMADO', label: 'Hormigón Armado' },
];

/**
 * Hook: catálogos estáticos (giros, garantías, tipos constructivos, CP).
 */
export function useCatalogos() {
  const [giros, setGiros] = useState([]);
  const [garantias, setGarantias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarCatalogos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [girosData, garantiasData] = await Promise.all([
        obtenerGiros(),
        obtenerGarantias(),
      ]);
      setGiros(girosData);
      setGarantias(garantiasData);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al cargar catálogos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const validarCP = useCallback(async (cp) => {
    if (!cp || cp.length < 6) return null;
    try {
      const result = await validarCodigoPostal(cp);
      return result;
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'object'
        ? detail.message
        : detail || 'Código postal no válido';
      throw new Error(msg);
    }
  }, []);

  return {
    giros,
    garantias,
    tiposConstructivos: TIPOS_CONSTRUCTIVOS,
    loading,
    error,
    cargarCatalogos,
    validarCP,
  };
}
