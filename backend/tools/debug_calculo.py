#!/usr/bin/env python3
"""
debug_calculo.py

Herramienta de diagnóstico: obtiene `ubicaciones` y ejecuta `/calculate` para un `folio`,
imprime detalles por ubicación y compara sumas.

Uso:
  python tools/debug_calculo.py <FOLIO> [API_BASE]

Ejemplo:
  python tools/debug_calculo.py F2026041700001 http://localhost:8000
"""
import sys
import json
import httpx


def pretty(n):
    try:
        return "{:,.2f}".format(float(n))
    except Exception:
        return str(n)


def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/debug_calculo.py <FOLIO> [API_BASE]")
        sys.exit(1)
    folio = sys.argv[1]
    api = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8000"

    client = httpx.Client(timeout=15.0)

    try:
        r = client.get(f"{api}/v1/quotes/{folio}/locations")
        r.raise_for_status()
    except Exception as e:
        print("Error fetching locations:", e)
        sys.exit(2)

    loc_data = r.json()
    ubicaciones = loc_data.get("ubicaciones", [])
    print(f"Ubicaciones ({len(ubicaciones)}):")
    for ub in ubicaciones:
        nombre = ub.get("nombre_ubicacion")
        indice = ub.get("indice")
        garantias = ub.get("garantias", [])
        total_sa = sum(g.get("suma_asegurada", 0) for g in garantias)
        print(f" - [{indice}] {nombre} - total suma_asegurada: {pretty(total_sa)} - garantias: {len(garantias)}")
        for g in garantias:
            print(f"    * {g.get('codigo_garantia')} suma: {pretty(g.get('suma_asegurada'))} tasa: {g.get('tasa')}")

    try:
        r2 = client.post(f"{api}/v1/quotes/{folio}/calculate")
        r2.raise_for_status()
    except Exception as e:
        print("Error executing calculate:", e)
        if hasattr(e, 'response') and e.response is not None:
            try:
                print('Response body:', e.response.text)
            except Exception:
                pass
        sys.exit(3)

    res = r2.json()
    rf = res.get("resultado_financiero", {})
    print("\nResultado financiero:")
    print("Prima neta:", rf.get("prima_neta"))
    print("Prima comercial:", rf.get("prima_comercial"))
    pp = rf.get("primas_por_ubicacion", [])
    print("Primas por ubicación (count):", len(pp))
    for p in pp:
        print(f" - [{p.get('ubicacion_indice')}] {p.get('nombre_ubicacion')}: prima_neta_ubicacion={p.get('prima_neta_ubicacion')} prima_comercial_ubicacion={p.get('prima_comercial_ubicacion')}")
        comps = p.get("primas_componentes", [])
        for c in comps:
            print(f"    - {c.get('cobertura')} suma={c.get('suma_asegurada')} tasa={c.get('tasa')} prima_unitaria={c.get('prima_unitaria')} prima_calculada={c.get('prima_calculada')}")

    sum_primas = sum(p.get("prima_neta_ubicacion", 0) for p in pp)
    print("\nSum of primas_por_ubicacion:", sum_primas)
    print("prima_neta_total from resultado:", rf.get("prima_neta"))
    if sum_primas != rf.get("prima_neta"):
        print("Mismatch: sum of location primes doesn't equal total")
    else:
        print("Totals match")

    print("\nFull calculation response:")
    print(json.dumps(res, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
