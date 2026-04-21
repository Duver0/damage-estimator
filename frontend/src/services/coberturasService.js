import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;

export async function obtenerCoberturas(folio) {
  const res = await axios.get(`${API_BASE}/v1/quotes/${folio}/coverage-options`);
  return res.data;
}

export async function actualizarCoberturas(folio, opciones, version) {
  const res = await axios.put(`${API_BASE}/v1/quotes/${folio}/coverage-options`, {
    opciones_cobertura: opciones,
    version,
  });
  return res.data;
}
