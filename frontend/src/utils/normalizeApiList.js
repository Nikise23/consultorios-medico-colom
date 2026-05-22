/**
 * Normaliza respuestas de la API a un array (axios + posibles envoltorios).
 */
export function normalizeApiList(response) {
  const body = response?.data
  if (Array.isArray(body)) return body
  if (Array.isArray(body?.data)) return body.data
  return []
}
