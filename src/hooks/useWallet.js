import { useState, useEffect, useCallback } from "react"
import { supabase } from "../config/supabaseClient"

// --- Utilitário interno -------------------------------------------------------

async function extractError(err) {
  if (err instanceof Response) {
    try {
      const d = await err.json()
      return d.error || d.message || "Erro no servidor."
    } catch (_) {
      try { return await err.text() } catch (_) {}
    }
  }
  return err?.message || String(err)
}

async function invokeWallet(action, data = {}) {
  try {
    const { data: res, error } = await supabase.functions.invoke("wallet-api", {
      body: { action, data }
    })
    if (error) return { success: false, error: await extractError(error) }
    if (res?.error) return { success: false, error: res.error }
    return { success: true, data: res }
  } catch (err) {
    console.error(`[useWallet] Erro em "${action}":`, err)
    return { success: false, error: err?.message || "Falha na operação." }
  }
}

// --- Funções exportadas (podem ser usadas sem hook) -------------------------

export async function getWallet() {
  return invokeWallet("get-wallet")
}

export async function getWalletHistory(options = {}) {
  return invokeWallet("get-history", options)
}

export async function depositToWallet(amount, payment_method) {
  return invokeWallet("deposit", { amount, payment_method })
}

export async function withdrawFromWallet(amount, details = {}) {
  return invokeWallet("withdrawal", { amount, ...details })
}

export async function transferFromWallet(amount, recipient_email, note = "") {
  return invokeWallet("transfer", { amount, recipient_email, note })
}

export async function payWithWallet(amount, description, extra = {}) {
  return invokeWallet("pay-internal", { amount, description, ...extra })
}

// --- Hook React ---------------------------------------------------------------

/**
 * Hook para obter e monitorizar o saldo da carteira do utilizador autenticado.
 * @param {string|undefined} userId
 */
export function useWallet(userId) {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const res = await getWallet()
    if (res.success) {
      setWallet(res.data?.wallet || res.data || null)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    reload()
  }, [reload])

  return { wallet, loading, reload }
}
