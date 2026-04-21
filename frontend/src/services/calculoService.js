import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;

/**
 * Ejecuta el cálculo de prima para una cotización.
 * CRITERIO-12.1
 */
export async function ejecutarCalculo(folio) {
  const res = await axios.post(`${API_BASE}/v1/quotes/${folio}/calculate`, {});
  return res.data;
}
