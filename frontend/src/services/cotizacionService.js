import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;

/**
 * Crea una nueva cotización (folio).
 * CRITERIO-1.1
 */
export async function crearCotizacion(datos, idempotencyKey = null) {
  const headers = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  const res = await axios.post(`${API_BASE}/v1/folios`, datos, { headers });
  return res.data;
}

/**
 * Obtiene el estado general de una cotización.
 */
export async function obtenerEstado(folio) {
  const res = await axios.get(`${API_BASE}/v1/quotes/${folio}/state`);
  return res.data;
}

/**
 * Lista todas las cotizaciones con resumen.
 */
export async function listarCotizaciones() {
  const res = await axios.get(`${API_BASE}/v1/quotes/list`);
  return res.data;
}

/**
 * Elimina una cotización.
 */
export async function eliminarCotizacion(folio) {
  const res = await axios.delete(`${API_BASE}/v1/quotes/${folio}`);
  return res.data;
}
