import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;

/**
 * Obtiene los datos generales de una cotización.
 */
export async function obtenerGeneralInfo(folio) {
  const res = await axios.get(`${API_BASE}/v1/quotes/${folio}/general-info`);
  return res.data;
}

/**
 * Actualiza datos generales de una cotización.
 * CRITERIO-3.1
 */
export async function actualizarGeneralInfo(folio, datos) {
  const res = await axios.put(`${API_BASE}/v1/quotes/${folio}/general-info`, datos);
  return res.data;
}
