// Estados de reserva padronizados em toda a aplicação.
// Preparado para futura integração com Supabase (enum em tabela bookings.status).

export const BOOKING_STATUS = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW'
})

