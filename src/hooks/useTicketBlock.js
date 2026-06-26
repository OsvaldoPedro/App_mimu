import { supabase } from "../config/supabaseClient"

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ticket-block-api`

async function callBlockApi(action, ticket_id, reason) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: "Nao autenticado." }

  try {
    const res = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, ticket_id, reason }),
    })
    const json = await res.json()
    if (!res.ok) return { success: false, error: json.error || "Erro desconhecido." }
    return { success: true, data: json }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

export const blockTicket = (ticket_id, reason) => callBlockApi("block", ticket_id, reason)
export const unblockTicket = (ticket_id) => callBlockApi("unblock", ticket_id, null)
