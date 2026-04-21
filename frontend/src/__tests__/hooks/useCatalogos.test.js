import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCatalogos } from '../../hooks/useCatalogos';
import * as service from '../../services/catalogosService';

vi.mock('../../services/catalogosService');

const mockGiros = [
  { clave_giro: 'OF', clave_incendio: 'OF_INC', descripcion: 'Oficinas' },
];
const mockGarantias = [
  { codigo_garantia: 'INCENDIO', nombre: 'Incendio' },
];

describe('useCatalogos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('estado inicial', () => {
    it('expone tiposConstructivos con los 4 tipos', () => {
      // GIVEN / WHEN
      const { result } = renderHook(() => useCatalogos());

      // THEN
      expect(result.current.tiposConstructivos).toHaveLength(4);
    });

    it('inicia con giros y garantias vacíos', () => {
      // GIVEN / WHEN
      const { result } = renderHook(() => useCatalogos());

      // THEN
      expect(result.current.giros).toEqual([]);
      expect(result.current.garantias).toEqual([]);
    });
  });

  describe('cargarCatalogos', () => {
    it('carga giros y garantias en paralelo', async () => {
      // GIVEN
      service.obtenerGiros.mockResolvedValue(mockGiros);
      service.obtenerGarantias.mockResolvedValue(mockGarantias);

      // WHEN
      const { result } = renderHook(() => useCatalogos());
      await act(async () => { await result.current.cargarCatalogos(); });

      // THEN
      expect(result.current.giros).toHaveLength(1);
      expect(result.current.garantias).toHaveLength(1);
      expect(result.current.loading).toBe(false);
    });

    it('setea error cuando la carga falla con detail', async () => {
      // GIVEN
      service.obtenerGiros.mockRejectedValue({
        response: { data: { detail: 'Error catálogos' } },
      });
      service.obtenerGarantias.mockResolvedValue([]);

      // WHEN
      const { result } = renderHook(() => useCatalogos());
      await act(async () => { await result.current.cargarCatalogos(); });

      // THEN
      expect(result.current.error).toBe('Error catálogos');
    });

    it('usa mensaje generico cuando error no tiene detail', async () => {
      // GIVEN
      service.obtenerGiros.mockRejectedValue(new Error('Network'));
      service.obtenerGarantias.mockResolvedValue([]);

      // WHEN
      const { result } = renderHook(() => useCatalogos());
      await act(async () => { await result.current.cargarCatalogos(); });

      // THEN
      expect(result.current.error).toBe('Error al cargar catálogos');
    });
  });

  describe('validarCP', () => {
    it('retorna null cuando cp es vacío', async () => {
      // GIVEN
      const { result } = renderHook(() => useCatalogos());

      // WHEN
      let returnValue;
      await act(async () => {
        returnValue = await result.current.validarCP('');
      });

      // THEN
      expect(returnValue).toBeNull();
      expect(service.validarCodigoPostal).not.toHaveBeenCalled();
    });

    it('retorna null cuando cp tiene menos de 6 caracteres', async () => {
      // GIVEN
      const { result } = renderHook(() => useCatalogos());

      // WHEN
      let returnValue;
      await act(async () => {
        returnValue = await result.current.validarCP('11011');
      });

      // THEN
      expect(returnValue).toBeNull();
    });

    it('llama al servicio con cp valido', async () => {
      // GIVEN
      const cpData = { estado: 'Bogotá DC', municipio: 'Bogotá' };
      service.validarCodigoPostal.mockResolvedValue(cpData);

      // WHEN
      const { result } = renderHook(() => useCatalogos());
      let returnValue;
      await act(async () => {
        returnValue = await result.current.validarCP('110111');
      });

      // THEN
      expect(service.validarCodigoPostal).toHaveBeenCalledWith('110111');
      expect(returnValue).toEqual(cpData);
    });

    it('lanza error con mensaje de detail objeto', async () => {
      // GIVEN
      service.validarCodigoPostal.mockRejectedValue({
        response: { data: { detail: { message: 'CP inválido' } } },
      });

      // WHEN
      const { result } = renderHook(() => useCatalogos());
      let thrown;
      await act(async () => {
        try { await result.current.validarCP('999999'); }
        catch (e) { thrown = e; }
      });

      // THEN
      expect(thrown.message).toBe('CP inválido');
    });

    it('lanza error con mensaje de detail string', async () => {
      // GIVEN
      service.validarCodigoPostal.mockRejectedValue({
        response: { data: { detail: 'Código postal no encontrado' } },
      });

      // WHEN
      const { result } = renderHook(() => useCatalogos());
      let thrown;
      await act(async () => {
        try { await result.current.validarCP('000000'); }
        catch (e) { thrown = e; }
      });

      // THEN
      expect(thrown.message).toBe('Código postal no encontrado');
    });

    it('usa mensaje generico cuando no hay detail', async () => {
      // GIVEN
      service.validarCodigoPostal.mockRejectedValue(new Error('Network'));

      // WHEN
      const { result } = renderHook(() => useCatalogos());
      let thrown;
      await act(async () => {
        try { await result.current.validarCP('110111'); }
        catch (e) { thrown = e; }
      });

      // THEN
      expect(thrown.message).toBe('Código postal no válido');
    });
  });
});
