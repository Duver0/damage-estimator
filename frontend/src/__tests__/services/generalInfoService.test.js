import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { obtenerGeneralInfo, actualizarGeneralInfo } from '../../services/generalInfoService';

vi.mock('axios');

describe('generalInfoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('obtenerGeneralInfo', () => {
    it('llama al endpoint correcto y retorna los datos', async () => {
      // GIVEN
      const data = { datos_asegurado: { nombre: 'Test' }, version: 1 };
      axios.get.mockResolvedValue({ data });

      // WHEN
      const result = await obtenerGeneralInfo('F20260417-00001');

      // THEN
      expect(result).toEqual(data);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/quotes/F20260417-00001/general-info')
      );
    });

    it('propaga errores del backend', async () => {
      // GIVEN
      axios.get.mockRejectedValue(new Error('Not found'));

      // WHEN / THEN
      await expect(obtenerGeneralInfo('FNOEXISTE')).rejects.toThrow('Not found');
    });
  });

  describe('actualizarGeneralInfo', () => {
    it('llama al endpoint PUT con los datos correctos', async () => {
      // GIVEN
      const datos = { datos_asegurado: { nombre: 'Juan' }, version: 2 };
      const respuesta = { ...datos, version: 3 };
      axios.put.mockResolvedValue({ data: respuesta });

      // WHEN
      const result = await actualizarGeneralInfo('F001', datos);

      // THEN
      expect(result).toEqual(respuesta);
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/v1/quotes/F001/general-info'),
        datos
      );
    });

    it('propaga errores 409 de conflicto', async () => {
      // GIVEN
      axios.put.mockRejectedValue({
        response: { status: 409, data: { detail: 'Version conflict' } },
      });

      // WHEN / THEN
      await expect(actualizarGeneralInfo('F001', {})).rejects.toMatchObject({
        response: { status: 409 },
      });
    });
  });
});
