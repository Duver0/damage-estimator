---
id: SPEC-006
status: IMPLEMENTED
feature: dashboard-eliminar-folio
created: 2026-04-19
updated: 2026-04-19
author: spec-generator
version: "1.0"
related-specs: [cotizador-frontend-main]
---

# SPEC-006 — Mover Eliminación de Folios al Dashboard de Cotizaciones

## 1. REQUERIMIENTOS

### Historia de Usuario

**Como** usuario del sistema,  
**Quiero** eliminar un folio directamente desde la columna de acciones del Dashboard de Cotizaciones (`DashboardPage`),  
**Para que** la acción de eliminación esté centralizada en la vista donde gestiono todas las cotizaciones, sin necesidad de seleccionar con checkboxes.

### Criterios de Aceptación (Gherkin)

#### Escenario 1 — Eliminar folio desde Dashboard (flujo feliz)

```gherkin
Dado que estoy en el Dashboard de Cotizaciones (/dashboard)
Y existe al menos una cotización en la tabla
Cuando hago clic en el botón "Eliminar" de una fila
Entonces aparece una confirmación: "¿Eliminar cotización <folio>?"
Cuando confirmo la eliminación
Entonces la cotización desaparece de la lista
Y la tabla se actualiza sin recargar la página completa
```

#### Escenario 2 — Cancelar eliminación

```gherkin
Dado que estoy en el Dashboard de Cotizaciones
Cuando hago clic en "Eliminar" de una fila y cancelo la confirmación
Entonces la cotización permanece en la lista
Y no se realiza ninguna llamada al backend
```

#### Escenario 3 — Error de backend al eliminar

```gherkin
Dado que el backend retorna un error al eliminar
Cuando confirmo la eliminación
Entonces aparece un mensaje de error: "Error al eliminar la cotización"
Y la fila permanece en la tabla
```

#### Escenario 4 — Botón deshabilitado durante eliminación

```gherkin
Dado que confirmé eliminar un folio
Cuando la petición DELETE está en curso
Entonces el botón "Eliminar" de esa fila muestra "Eliminando..."
Y está deshabilitado hasta que la operación finalice
```

### Reglas de Negocio

1. La eliminación es **individual por fila** — no hay selección múltiple en `DashboardPage`.
2. Siempre requiere **confirmación** (`window.confirm`) antes de ejecutar el DELETE.
3. Tras eliminar exitosamente → recargar lista de cotizaciones.
4. El botón "Eliminar" en `CotizadorPage` **debe ser removido** (checkboxes + action bar).
5. El import de `eliminarCotizacion` y el estado `seleccionados`/`deletingFolios` deben eliminarse de `CotizadorPage`.
6. No hay cambios en el backend — el endpoint `DELETE /v1/quotes/{folio}` ya existe.

---

## 2. DISEÑO

### Backend

**Sin cambios.** El endpoint ya existe:

```
DELETE /v1/quotes/{folio}
Response 200: { "message": "Cotización eliminada" }
Response 404: { "detail": "Cotización no encontrada" }
```

### Frontend

#### Cambios en `DashboardPage.jsx`

1. Agregar import de `eliminarCotizacion` desde `cotizacionService`.
2. Agregar estado local: `deletingFolio` (string | null) — el folio en proceso de eliminación.
3. Agregar estado local: `deleteError` (string | null).
4. Implementar función `handleEliminar(folio)`:
   - Confirma con `window.confirm("¿Eliminar cotización <folio>?")`
   - Pone `deletingFolio = folio`
   - Llama `eliminarCotizacion(folio)`
   - Si éxito: recarga lista (`cargarCotizaciones()`)
   - Si error: setea `deleteError`
   - Finalmente: `deletingFolio = null`
5. En `colAcciones` de cada fila, agregar botón `deleteBtn` después de `editBtn`:
   ```jsx
   <button
     className={styles.deleteBtn}
     onClick={() => handleEliminar(cot.numero_folio)}
     disabled={deletingFolio === cot.numero_folio}
   >
     {deletingFolio === cot.numero_folio ? 'Eliminando...' : '🗑️ Eliminar'}
   </button>
   ```
6. Mostrar `deleteError` vía `<AlertBox type="error" />` si existe.

#### Cambios en `DashboardPage.module.css`

Agregar estilo para `.deleteBtn`:

```css
.deleteBtn {
  padding: 0.5rem 0.8rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: background-color 0.3s;
}

.deleteBtn:hover:not(:disabled) {
  background-color: #c82333;
}

.deleteBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

#### Cambios en `CotizadorPage.jsx`

Remover todo lo relacionado con eliminación:

1. Quitar import `eliminarCotizacion` del import de `cotizacionService`.
2. Eliminar estados: `seleccionados` (Set), `deletingFolios`.
3. Eliminar función `toggleSeleccion`.
4. Eliminar función `handleEliminar`.
5. Eliminar checkbox (`cardCheckbox`) en cada `cotizacionCard`.
6. Eliminar `actionBar` (barra con conteo y botón eliminar).
7. Eliminar estilos CSS asociados en `CotizadorPage.module.css`: `.actionBar`, `.countSelected`, `.deleteBtn`, `.cardCheckbox`, `.selected`.
8. Restaurar `onClick` de `cardContent` sin la lógica de selección:
   ```jsx
   onClick={() => navigate(`/quotes/${cot.numero_folio}/view`)}
   style={{ cursor: 'pointer' }}
   ```

### Árbol de cambios

```
frontend/src/
├── pages/
│   ├── DashboardPage.jsx           ← MODIFICAR (agregar eliminar)
│   ├── DashboardPage.module.css    ← MODIFICAR (agregar .deleteBtn)
│   ├── CotizadorPage.jsx           ← MODIFICAR (remover eliminar)
│   └── CotizadorPage.module.css    ← MODIFICAR (remover estilos delete)
```

---

## 3. LISTA DE TAREAS

### Frontend

- [ ] `DashboardPage.jsx` — importar `eliminarCotizacion`
- [ ] `DashboardPage.jsx` — agregar estados `deletingFolio` y `deleteError`
- [ ] `DashboardPage.jsx` — implementar `handleEliminar(folio)`
- [ ] `DashboardPage.jsx` — agregar botón `deleteBtn` en `colAcciones`
- [ ] `DashboardPage.jsx` — mostrar `deleteError` vía `AlertBox`
- [ ] `DashboardPage.module.css` — agregar estilos `.deleteBtn`
- [ ] `CotizadorPage.jsx` — remover import `eliminarCotizacion`
- [ ] `CotizadorPage.jsx` — eliminar estados `seleccionados` y `deletingFolios`
- [ ] `CotizadorPage.jsx` — eliminar funciones `toggleSeleccion` y `handleEliminar`
- [ ] `CotizadorPage.jsx` — eliminar checkbox y `actionBar` del render
- [ ] `CotizadorPage.jsx` — simplificar `onClick` de `cardContent`
- [ ] `CotizadorPage.module.css` — eliminar estilos `.actionBar`, `.countSelected`, `.deleteBtn`, `.cardCheckbox`, `.selected`

### QA

- [ ] Verificar botón "Eliminar" aparece en cada fila del Dashboard
- [ ] Verificar confirmación antes de eliminar
- [ ] Verificar que cancelar confirmación no elimina
- [ ] Verificar que la lista se actualiza tras eliminar exitosamente
- [ ] Verificar mensaje de error si el backend falla
- [ ] Verificar que `CotizadorPage` ya no tiene checkboxes ni action bar
- [ ] Verificar que `CotizadorPage` no tiene import de `eliminarCotizacion`
