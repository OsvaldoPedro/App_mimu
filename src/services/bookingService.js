// Camada de serviço para reservas.
// Nesta fase apenas define a API interna da aplicação, preparada para integração futura com Supabase.

import { BOOKING_STATUS } from '../constants/bookingStatus'

/**
 * Cria uma nova reserva.
 * @param {Object} bookingData - dados da reserva (serviceId, clientId, price, etc.)
 * @returns {Promise<Object>} - reserva criada (mock ou vinda da API no futuro)
 */
export async function createBooking(bookingData) {
  // TODO: integrar com Supabase (tabela bookings)
  // Exemplo de estrutura esperada:
  // {
  //   id, service_id, client_id, provider_id, company_id,
  //   status: BOOKING_STATUS.PENDING, amount, currency, created_at, ...
  // }
  return {
    ...bookingData,
    id: bookingData.id || `bk_${Date.now()}`,
    status: bookingData.status || BOOKING_STATUS.PENDING
  }
}

/**
 * Actualiza o estado de uma reserva.
 * @param {string} bookingId
 * @param {BOOKING_STATUS} status
 */
export async function updateBookingStatus(bookingId, status) {
  // TODO: integrar com Supabase (update em bookings.status)
  return { id: bookingId, status }
}

/**
 * Obtém reservas com filtros opcionais.
 * @param {Object} filter - ex: { clientId, providerId, status }
 */
export async function getBookings(_filter = {}) {
  // TODO: integrar com Supabase (queries por utilizador, fornecedor, estado, etc.)
  return []
}

