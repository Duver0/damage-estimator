import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { ejecutarCalculo } from '../../services/calculoService';

vi.mock('axios');

describe('calculoService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deberia llamar POST /v1/quotes/:folio/calculate', async () => {
    const resultado = {
      numero_folio: 'F2026041700001',
      estado_cotizacion: 'COTIZADA',
      resultado_financiero: { prima_neta: 5000, prima_comercial: 6750 },
    };
    axios.post.mockResolvedValue({ data: resultado });

    const result = await ejecutarCalculo('F2026041700001');

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/v1/quotes/F2026041700001/calculate'),
      {}
    );
    expect(result.estado_cotizacion).toBe('COTIZADA');
    expect(result.resultado_financiero.prima_neta).toBe(5000);
  });

  it('deberia propagar error 400 sin ubicaciones', async () => {
    axios.post.mockRejectedValue({
      response: { status: 400, data: { detail: 'No hay ubicaciones válidas' } }
    });

    await expect(ejecutarCalculo('F001')).rejects.toBeDefined();
  });
});
