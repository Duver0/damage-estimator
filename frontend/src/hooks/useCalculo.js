import { useState, useCallback } from 'react';
import { ejecutarCalculo } from '../services/calculoService';

/**
 * Hook: estado y disparo del cálculo de prima.
 */
export function useCalculo(folio) {
  const [primaNeta, setPrimaNeta] = useState(null);
  const [primaComercial, setPrimaComercial] = useState(null);
  const [desglose, setDesglose] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calcular = useCallback(async () => {
    if (!folio) return;
    setLoading(true);
    setError(null);
    try {
      const result = await ejecutarCalculo(folio);
      const rf = result.resultado_financiero || {};
      setPrimaNeta(rf.prima_neta);
      setPrimaComercial(rf.prima_comercial);
      setDesglose(rf.primas_por_ubicacion || []);
      setAlertas(result.alertas || []);
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al calcular prima';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [folio]);

  return { primaNeta, primaComercial, desglose, alertas, loading, error, calcular };
}
