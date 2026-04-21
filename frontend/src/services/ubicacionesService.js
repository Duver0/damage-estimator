import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;

export async function setLayout(folio, cantidad, version) {
  const res = await axios.put(`${API_BASE}/v1/quotes/${folio}/locations/layout`, {
    cantidad_ubicaciones: cantidad,
    version,
  });
  return res.data;
}

export async function getLayout(folio) {
  const res = await axios.get(`${API_BASE}/v1/quotes/${folio}/locations/layout`);
  return res.data;
}

export async function agregarUbicaciones(folio, ubicaciones, version) {
  const res = await axios.put(`${API_BASE}/v1/quotes/${folio}/locations`, {
    ubicaciones,
    version,
  });
  return res.data;
}

export async function obtenerUbicaciones(folio) {
  const res = await axios.get(`${API_BASE}/v1/quotes/${folio}/locations`);
  return res.data;
}

export async function editarUbicacion(folio, indice, datos, version) {
  const res = await axios.patch(`${API_BASE}/v1/quotes/${folio}/locations/${indice}`, {
    ...datos,
    version,
  });
  return res.data;
}

export async function obtenerResumen(folio) {
  const res = await axios.get(`${API_BASE}/v1/quotes/${folio}/locations/summary`);
  return res.data;
}
