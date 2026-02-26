// Serviço de pagamentos.
// Nesta fase apenas define a API para futura integração com processadores de pagamento e Supabase.

/**
 * Regista um pagamento processado dentro da plataforma.
 * Ex: pagamento com cartão ou referência.
 */
export async function registerPayment({ bookingId, amount, currency, method, metadata = {} }) {
  // TODO: integrar com Supabase (tabela payments) e PSP
  return {
    id: `pay_${Date.now()}`,
    bookingId,
    amount,
    currency,
    method,
    metadata
  }
}

/**
 * Regista um pagamento manual (fora da plataforma).
 * Ex: o fornecedor marcou como pago em dinheiro ou transferência directa.
 */
export async function registerManualPayment({ bookingId, amount, currency, note }) {
  // TODO: integrar com Supabase (payments + marcação de manual_payment = true)
  return {
    id: `pay_manual_${Date.now()}`,
    bookingId,
    amount,
    currency,
    method: 'MANUAL',
    note
  }
}

/**
 * Calcula um pagamento parcial (depósito) com base num montante total e percentagem.
 * Não persiste, apenas devolve o valor calculado.
 */
export function calculatePartialPayment(totalAmount, percentage) {
  if (!totalAmount || !percentage) return 0
  const value = (Number(totalAmount) * Number(percentage)) / 100
  return Math.round(value)
}

