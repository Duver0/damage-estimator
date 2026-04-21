import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  obtenerAgentes,
  obtenerGiros,
  obtenerGarantias,
  validarCodigoPostal,
} from '../../services/catalogosService';

vi.mock('axios');

describe('catalogosService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('obtenerAgentes', () => {
    it('retorna los agentes del backend', async () => {
      // GIVEN
      const agentes = [{ codigo: 'AG001', nombre: 'Agente Uno' }];
      axios.get.mockResolvedValue({ data: agentes });

      // WHEN
      const result = await obtenerAgentes();

      // THEN
      expect(result).toEqual(agentes);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/v1/catalogs/agents'));
    });

    it('propaga errores del backend', async () => {
      // GIVEN
      axios.get.mockRejectedValue(new Error('Network error'));

      // WHEN / THEN
      await expect(obtenerAgentes()).rejects.toThrow('Network error');
    });
  });

  describe('obtenerGiros', () => {
    it('retorna los giros del backend', async () => {
      // GIVEN
      const giros = [{ clave_giro: 'OF', descripcion: 'Oficinas' }];
      axios.get.mockResolvedValue({ data: giros });

      // WHEN
      const result = await obtenerGiros();

      // THEN
      expect(result).toEqual(giros);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/v1/catalogs/business-lines'));
    });
  });

  describe('obtenerGarantias', () => {
    it('retorna las garantias del backend', async () => {
      // GIVEN
      const garantias = [{ codigo_garantia: 'INCENDIO', nombre: 'Incendio' }];
      axios.get.mockResolvedValue({ data: garantias });

      // WHEN
      const result = await obtenerGarantias();

      // THEN
      expect(result).toEqual(garantias);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/v1/catalogs/guarantees'));
    });
  });

  describe('validarCodigoPostal', () => {
    it('llama al endpoint con el CP correcto', async () => {
      // GIVEN
      const cpData = { estado: 'Bogotá DC', municipio: 'Bogotá' };
      axios.get.mockResolvedValue({ data: cpData });

      // WHEN
      const result = await validarCodigoPostal('110111');

      // THEN
      expect(result).toEqual(cpData);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/v1/catalogs/zip-codes/110111'));
    });

    it('propaga error 404 cuando CP no existe', async () => {
      // GIVEN
      axios.get.mockRejectedValue({ response: { status: 404, data: { detail: 'CP no encontrado' } } });

      // WHEN / THEN
      await expect(validarCodigoPostal('000000')).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });
});
