import { supabase } from '../config/supabaseClient'

/**
 * Auxiliar para formatar erros retornados pelas Edge Functions
 */
async function extractErrorMessage(err) {
  if (err instanceof Response) {
    try {
      const data = await err.json()
      return data.error || data.message || 'Erro no servidor de pagamentos.'
    } catch (_) {
      try {
        return await err.text()
      } catch (_) {}
    }
  }
  return err.message || String(err)
}

/**
 * Cria um pagamento/cobrança no Appy Pay e regista-o na tabela local payments
 * 
 * @param {object} paymentData Dados do pagamento (user_id, amount, payment_method, etc.)
 */
export async function createAppyPayment(paymentData) {
  try {
    const { data, error } = await supabase.functions.invoke('appy-pay-api', {
      body: {
        action: 'create-payment',
        data: paymentData
      }
    })

    if (error) {
      const msg = await extractErrorMessage(error)
      return { success: false, error: msg }
    }

    if (data?.error) {
      return { success: false, error: data.error }
    }

    return { success: true, data }
  } catch (err) {
    console.error('[useAppyPay] Erro ao invocar create-payment:', err)
    return { success: false, error: err.message || 'Falha ao iniciar pagamento.' }
  }
}

/**
 * Obtém e sincroniza o estado de um pagamento com a gateway Appy Pay
 * 
 * @param {string} paymentId ID do pagamento local no Supabase
 * @param {string} transactionId ID de transação/cobrança externa da Appy Pay
 */
export async function getAppyPaymentStatus(paymentId, transactionId = null) {
  try {
    const { data, error } = await supabase.functions.invoke('appy-pay-api', {
      body: {
        action: 'payment-status',
        data: { payment_id: paymentId, transaction_id: transactionId }
      }
    })

    if (error) {
      const msg = await extractErrorMessage(error)
      return { success: false, error: msg }
    }

    if (data?.error) {
      return { success: false, error: data.error }
    }

    return { success: true, data }
  } catch (err) {
    console.error('[useAppyPay] Erro ao invocar payment-status:', err)
    return { success: false, error: err.message || 'Falha ao consultar estado do pagamento.' }
  }
}

/**
 * Cancela um pagamento pendente na gateway Appy Pay
 * 
 * @param {string} paymentId ID do pagamento local no Supabase
 * @param {string} transactionId ID de transação/cobrança externa da Appy Pay
 */
export async function cancelAppyPayment(paymentId, transactionId = null) {
  try {
    const { data, error } = await supabase.functions.invoke('appy-pay-api', {
      body: {
        action: 'cancel-payment',
        data: { payment_id: paymentId, transaction_id: transactionId }
      }
    })

    if (error) {
      const msg = await extractErrorMessage(error)
      return { success: false, error: msg }
    }

    if (data?.error) {
      return { success: false, error: data.error }
    }

    return { success: true, data }
  } catch (err) {
    console.error('[useAppyPay] Erro ao invocar cancel-payment:', err)
    return { success: false, error: err.message || 'Falha ao cancelar pagamento.' }
  }
}
