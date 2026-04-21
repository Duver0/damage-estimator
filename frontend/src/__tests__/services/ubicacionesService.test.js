import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  setLayout,
  getLayout,
  agregarUbicaciones,
  obtenerUbicaciones,
  editarUbicacion,
  obtenerResumen,
} from '../../services/ubicacionesService';

vi.mock('axios');

describe('ubicacionesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setLayout', () => {
    it('llama al endpoint PUT con cantidad y version', async () => {
      // GIVEN
      const data = { configuracion_layout: { cantidad: 3 }, version: 2 };
      axios.put.mockResolvedValue({ data });

      // WHEN
      const result = await setLayout('F001', 3, 1);

      // THEN
      expect(result).toEqual(data);
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/v1/quotes/F001/locations/layout'),
        { cantidad_ubicaciones: 3, version: 1 }
      );
    });
  });

  describe('getLayout', () => {
    it('llama al endpoint GET correcto', async () => {
      // GIVEN
      const data = { configuracion_layout: { cantidad: 2 } };
      axios.get.mockResolvedValue({ data });

      // WHEN
      const result = await getLayout('F001');

      // THEN
      expect(result).toEqual(data);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/quotes/F001/locations/layout')
      );
    });
  });

  describe('agregarUbicaciones', () => {
    it('llama al endpoint PUT con ubicaciones y version', async () => {
      // GIVEN
      const ubicaciones = [{ nombre_ubicacion: 'Oficina' }];
      const data = { ubicaciones, version: 2 };
      axios.put.mockResolvedValue({ data });

      // WHEN
      const result = await agregarUbicaciones('F001', ubicaciones, 1);

      // THEN
      expect(result).toEqual(data);
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/v1/quotes/F001/locations'),
        { ubicaciones, version: 1 }
      );
    });
  });

  describe('obtenerUbicaciones', () => {
    it('llama al endpoint GET y retorna ubicaciones', async () => {
      // GIVEN
      const data = { ubicaciones: [], version: 1 };
      axios.get.mockResolvedValue({ data });

      // WHEN
      const result = await obtenerUbicaciones('F001');

      // THEN
      expect(result).toEqual(data);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/quotes/F001/locations')
      );
    });

    it('propaga errores del backend', async () => {
      // GIVEN
      axios.get.mockRejectedValue(new Error('Not found'));

      // WHEN / THEN
      await expect(obtenerUbicaciones('FNOEXISTE')).rejects.toThrow('Not found');
    });
  });

  describe('editarUbicacion', () => {
    it('llama al endpoint PATCH con datos y version', async () => {
      // GIVEN
      const datos = { nombre_ubicacion: 'Editada', codigo_postal: '110111' };
      const data = { indice: 0, ...datos };
      axios.patch.mockResolvedValue({ data });

      // WHEN
      const result = await editarUbicacion('F001', 0, datos, 1);

      // THEN
      expect(result).toEqual(data);
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/quotes/F001/locations/0'),
        { ...datos, version: 1 }
      );
    });

    it('propaga errores 409 de conflicto', async () => {
      // GIVEN
      axios.patch.mockRejectedValue({
        response: { status: 409, data: { detail: 'Version conflict' } },
      });

      // WHEN / THEN
      await expect(editarUbicacion('F001', 0, {}, 1)).rejects.toMatchObject({
        response: { status: 409 },
      });
    });
  });

  describe('obtenerResumen', () => {
    it('llama al endpoint GET de resumen', async () => {
      // GIVEN
      const data = { total: 2, completas: 1, incompletas: 1 };
      axios.get.mockResolvedValue({ data });

      // WHEN
      const result = await obtenerResumen('F001');

      // THEN
      expect(result).toEqual(data);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/quotes/F001/locations/summary')
      );
    });
  });
});
