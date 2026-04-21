import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;

export async function obtenerAgentes() {
  const res = await axios.get(`${API_BASE}/v1/catalogs/agents`);
  return res.data;
}

export async function obtenerGiros() {
  const res = await axios.get(`${API_BASE}/v1/catalogs/business-lines`);
  return res.data;
}

export async function obtenerGarantias() {
  const res = await axios.get(`${API_BASE}/v1/catalogs/guarantees`);
  return res.data;
}

export async function validarCodigoPostal(cp) {
  const res = await axios.get(`${API_BASE}/v1/catalogs/zip-codes/${cp}`);
  return res.data;
}
