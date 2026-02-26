// Serviço de comissões e dívida dos fornecedores.
// Toda a lógica financeira deve residir aqui (e em /config, /constants), nunca em componentes React.

import { BOOKING_STATUS } from '../constants/bookingStatus'
import { commissionRules } from '../config/commissionRules'

/**
 * Calcula a comissão bruta para um serviço, com base nas regras de comissão
 * e nos dados do booking/serviço.
 *
 * @param {Object} params
 * @param {string} params.categoryKey - chave usada em commissionRules (ex: 'accommodation')
 * @param {number} params.amount - valor total do serviço/reserva
 * @param {string} [params.plan] - plano do fornecedor (starter, standard, plus)
 */
export function calculateCommission({ categoryKey, amount, plan }) {
  const rule = commissionRules[categoryKey]
  if (!rule || !amount) return 0

  const value = Number(amount)

  if (rule.plans && plan && rule.plans[plan] != null) {
    return Math.round((value * rule.plans[plan]) / 100)
  }

  if (rule.commissionMin != null && rule.commissionMax != null) {
    // Para já usar o mínimo, podendo ser ajustado com lógica de margem no futuro.
    return Math.round((value * rule.commissionMin) / 100)
  }

  if (rule.commissionMin != null) {
    return Math.round((value * rule.commissionMin) / 100)
  }

  return 0
}

/**
 * Regra principal: só calcula/retorna comissão quando a reserva estiver COMPLETED.
 * Caso contrário, devolve 0.
 */
export function calculateCommissionIfCompleted(booking, options) {
  if (!booking || booking.status !== BOOKING_STATUS.COMPLETED) return 0
  return calculateCommission(options)
}

/**
 * Gera (ou incrementa) dívida de comissão para um fornecedor quando o pagamento foi fora da plataforma.
 * Apenas prepara a estrutura; persistência real deve ser feita via Supabase.
 *
 * @param {Object} provider - registo do fornecedor (empresa ou prestador)
 * @param {number} commissionAmount - valor da comissão devida
 */
export function generateCommissionDebt(provider, commissionAmount) {
  if (!provider || !commissionAmount) return provider
  const currentDebt = Number(provider.provider_debt || 0)
  const nextDebt = currentDebt + Number(commissionAmount)
  return {
    ...provider,
    provider_debt: nextDebt
  }
}

/**
 * Obtém a dívida actual de um fornecedor.
 * No futuro deve ler de uma tabela dedicada (ex: provider_balances).
 */
export function getProviderDebt(provider) {
  if (!provider) return 0
  return Number(provider.provider_debt || 0)
}

/**
 * Verifica se o fornecedor deve ser bloqueado com base na dívida e no número de serviços concluídos
 * sem liquidação das comissões.
 *
 * Regra proposta:
 * - Se provider_debt > 0
 * - E existirem >= 2 serviços concluídos adicionais sem pagamento
 *   => status = 'BLOCKED'
 *
 * Esta função apenas calcula o status sugerido; a persistência é responsabilidade da camada de dados.
 *
 * @param {Object} provider - registo do fornecedor
 * @param {number} completedSinceDebt - número de serviços concluídos desde que a dívida surgiu
 */
export function checkProviderDebtStatus(provider, completedSinceDebt) {
  const debt = getProviderDebt(provider)
  if (!debt || !completedSinceDebt || completedSinceDebt < 2) {
    return provider?.status || 'active'
  }
  return 'BLOCKED'
}

