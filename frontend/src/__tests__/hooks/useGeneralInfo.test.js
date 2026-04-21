import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeneralInfo } from '../../hooks/useGeneralInfo';
import * as service from '../../services/generalInfoService';

vi.mock('../../services/generalInfoService');

describe('useGeneralInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cargar', () => {
    it('carga datos y actualiza estado', async () => {
      // GIVEN
      const mockData = {
        datos_asegurado: { nombre: 'Test' },
        datos_conduccion: { codigo_agente: 'AG001' },
        version: 2,
      };
      service.obtenerGeneralInfo.mockResolvedValue(mockData);

      // WHEN
      const { result } = renderHook(() => useGeneralInfo('F2026041700001'));
      await act(async () => { await result.current.cargar(); });

      // THEN
      expect(result.current.datosAsegurado).toEqual({ nombre: 'Test' });
      expect(result.current.version).toBe(2);
      expect(result.current.loading).toBe(false);
    });

    it('no hace nada si folio es null', async () => {
      // GIVEN
      const { result } = renderHook(() => useGeneralInfo(null));

      // WHEN
      await act(async () => { await result.current.cargar(); });

      // THEN
      expect(service.obtenerGeneralInfo).not.toHaveBeenCalled();
    });

    it('setea error cuando service falla', async () => {
      // GIVEN
      service.obtenerGeneralInfo.mockRejectedValue({
        response: { data: { detail: 'Folio no encontrado' } },
      });

      // WHEN
      const { result } = renderHook(() => useGeneralInfo('FNOEXISTE'));
      await act(async () => {
        try { await result.current.cargar(); } catch {}
      });

      // THEN
      expect(result.current.error).toBe('Folio no encontrado');
    });
  });

  describe('guardar', () => {
    it('envia version actual al servicio', async () => {
      // GIVEN
      const mockLoaded = { datos_asegurado: {}, datos_conduccion: {}, version: 3 };
      service.obtenerGeneralInfo.mockResolvedValue(mockLoaded);
      service.actualizarGeneralInfo.mockResolvedValue({ ...mockLoaded, version: 4 });

      const { result } = renderHook(() => useGeneralInfo('F2026041700001'));
      await act(async () => { await result.current.cargar(); });

      // WHEN
      await act(async () => {
        await result.current.guardar({ datos_asegurado: { nombre: 'Nuevo' } });
      });

      // THEN
      expect(service.actualizarGeneralInfo).toHaveBeenCalledWith(
        'F2026041700001',
        expect.objectContaining({ version: 3 })
      );
      expect(result.current.version).toBe(4);
    });

    it('usa version 1 como fallback cuando version es null', async () => {
      // GIVEN — cargar no fue llamado, version = null
      service.actualizarGeneralInfo.mockResolvedValue({ datos_asegurado: {}, datos_conduccion: {}, version: 2 });

      // WHEN
      const { result } = renderHook(() => useGeneralInfo('F2026041700001'));
      await act(async () => {
        await result.current.guardar({ datos_asegurado: {} });
      });

      // THEN
      expect(service.actualizarGeneralInfo).toHaveBeenCalledWith(
        'F2026041700001',
        expect.objectContaining({ version: 1 })
      );
    });
  });
});
