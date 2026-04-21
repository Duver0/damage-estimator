/**
 * Tests unitarios para cotizacionService.
 * Mockea axios para no hacer llamadas reales.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { crearCotizacion, obtenerEstado } from '../../services/cotizacionService';

vi.mock('axios');

const API_BASE = 'http://localhost:8000';

describe('cotizacionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('crearCotizacion', () => {
    it('deberia llamar POST /v1/folios con datos correctos', async () => {
      // GIVEN
      const datos = { datos_asegurado: { nombre: 'Test' } };
      const respuesta = { numero_folio: 'F2026041700001', estado_cotizacion: 'CREADA', version: 1 };
      axios.post.mockResolvedValue({ data: respuesta });

      // WHEN
      const result = await crearCotizacion(datos);

      // THEN
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/folios'),
        datos,
        expect.any(Object)
      );
      expect(result.numero_folio).toBe('F2026041700001');
    });

    it('deberia incluir Idempotency-Key en headers cuando se provee', async () => {
      // GIVEN
      axios.post.mockResolvedValue({ data: { numero_folio: 'F001' } });

      // WHEN
      await crearCotizacion({}, 'my-key-123');

      // THEN
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        {},
        expect.objectContaining({
          headers: expect.objectContaining({ 'Idempotency-Key': 'my-key-123' })
        })
      );
    });

    it('deberia propagar error de axios', async () => {
      // GIVEN
      axios.post.mockRejectedValue({ response: { data: { detail: 'Error 400' }, status: 400 } });

      // WHEN / THEN
      await expect(crearCotizacion({})).rejects.toBeDefined();
    });
  });

  describe('obtenerEstado', () => {
    it('deberia llamar GET /v1/quotes/:folio/state', async () => {
      // GIVEN
      const estado = { estado_cotizacion: 'CREADA', version: 1 };
      axios.get.mockResolvedValue({ data: estado });

      // WHEN
      const result = await obtenerEstado('F2026041700001');

      // THEN
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/quotes/F2026041700001/state')
      );
      expect(result.estado_cotizacion).toBe('CREADA');
    });
  });
});
