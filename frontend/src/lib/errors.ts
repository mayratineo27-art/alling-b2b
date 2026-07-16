/**
 * FastAPI puede responder `detail` de dos formas muy distintas:
 * - string: nuestras DomainException ("Formato no encontrado", etc.)
 * - array de objetos {type, loc, msg, input, ctx}: errores 422 de validación
 *   automática de Pydantic (parámetros/body inválidos).
 *
 * Renderizar `error.response.data.detail` directo en JSX revienta toda la
 * página ("Objects are not valid as a React child") si el backend devuelve
 * la segunda forma. Este helper normaliza ambas a un string seguro.
 */
export function getErrorMessage(err: any, fallback: string): string {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) => (typeof d === "string" ? d : d?.msg))
      .filter(Boolean);
    if (msgs.length > 0) return msgs.join(". ");
  }

  return fallback;
}
