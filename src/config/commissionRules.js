import { MONETIZATION_TYPES } from '../constants/monetization'

// Regras financeiras por tipo de serviço/categoria.
// Preparado para ser espelhado em tabelas de configuração no Supabase.

export const commissionRules = {
  accommodation: {
    type: MONETIZATION_TYPES.DIRECT_PAYMENT,
    plans: {
      starter: 12,
      standard: 15,
      plus: 18
    },
    chargeOnlyAfterCompleted: true
  },

  restaurants: {
    type: 'COVER_FEE',
    min: 1500,
    max: 4000
  },

  events: {
    type: 'PREPAID',
    commissionMin: 10,
    commissionMax: 15,
    depositMin: 20,
    depositMax: 50
  },

  experiences: {
    type: 'PREPAID',
    commissionMin: 12,
    commissionMax: 20,
    ticketFeeMin: 300,
    ticketFeeMax: 1000
  },

  transport: {
    commissionMin: 10,
    commissionMax: 18
  },

  beauty: {
    feeMin: 500,
    feeMax: 2500
  },

  professional_services: {
    commissionMin: 10,
    commissionMax: 15
  }
}

