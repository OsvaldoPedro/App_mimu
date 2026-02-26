// Modelos de monetização disponíveis na plataforma.
// Estes valores podem ser usados como enums em tabelas Supabase (ex: services.monetization_type).

export const MONETIZATION_TYPES = Object.freeze({
  DIRECT_PAYMENT: 'DIRECT_PAYMENT',
  PREPAID_PLATFORM: 'PREPAID_PLATFORM',
  SUBSCRIPTION: 'SUBSCRIPTION',
  COVER_FEE: 'COVER_FEE',
  PREPAID: 'PREPAID'
})

// Estados de subscrição mensal.
export const SUBSCRIPTION_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  OVERDUE: 'OVERDUE'
})

