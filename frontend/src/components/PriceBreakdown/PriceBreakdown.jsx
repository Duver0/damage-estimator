export default function PriceBreakdown({ primaNeta, primaComercial, primas }) {
  if (!primaNeta && !primaComercial) return null;
  return (
    <div role="region" aria-label="Desglose de prima">
      {primaNeta != null && <p>Prima Neta: {primaNeta}</p>}
      {primaComercial != null && <p>Prima Comercial: {primaComercial}</p>}
    </div>
  );
}
