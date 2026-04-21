import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { obtenerCoberturas, actualizarCoberturas } from '../../services/coberturasService';

vi.mock('axios');

describe('coberturasService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('obtenerCoberturas', () => {
    it('llama al endpoint correcto con el folio', async () => {
      // GIVEN
      const data = { opciones_cobertura: [], version: 1 };
      axios.get.mockResolvedValue({ data });

      // WHEN
      const result = await obtenerCoberturas('F20260417-00001');

      // THEN
      expect(result).toEqual(data);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/quotes/F20260417-00001/coverage-options')
      );
    });

    it('propaga errores del backend', async () => {
      // GIVEN
      axios.get.mockRejectedValue(new Error('Server error'));

      // WHEN / THEN
      await expect(obtenerCoberturas('F001')).rejects.toThrow('Server error');
    });
  });

  describe('actualizarCoberturas', () => {
    it('llama al endpoint PUT con opciones y version', async () => {
      // GIVEN
      const data = { opciones_cobertura: [], version: 2 };
      axios.put.mockResolvedValue({ data });

      const opciones = [{ cobertura: 'INCENDIO', activa: true }];

      // WHEN
      const result = await actualizarCoberturas('F001', opciones, 1);

      // THEN
      expect(result).toEqual(data);
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/v1/quotes/F001/coverage-options'),
        { opciones_cobertura: opciones, version: 1 }
      );
    });

    it('propaga errores 409 de conflicto de version', async () => {
      // GIVEN
      axios.put.mockRejectedValue({
        response: { status: 409, data: { detail: 'Conflicto de versión' } },
      });

      // WHEN / THEN
      await expect(actualizarCoberturas('F001', [], 1)).rejects.toMatchObject({
        response: { status: 409 },
      });
    });
  });
});
