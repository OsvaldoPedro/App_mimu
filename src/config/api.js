/**
 * URL base da API. Deixe vazio para usar apenas localStorage (modo demo).
 * Exemplo: 'https://api.seudominio.com'
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export function getProfileEndpoint(userType, id) {
  if (!id) return null
  const base = API_BASE_URL.replace(/\/$/, '')
  const path = { cliente: 'cliente', empresa: 'empresa', prestador: 'prestador' }[userType]
  return path ? `${base}/${path}/${id}` : null
}
