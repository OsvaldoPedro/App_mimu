import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""

    const authHeader = req.headers.get("Authorization") ?? ""
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Nao autenticado." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const { data: profile } = await supabaseUser
      .from("profiles").select("role").eq("id", user.id).single()
    const isAdmin = profile?.role === "admin"

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const body = await req.json()
    const { action, ticket_id, reason } = body

    if (!action || !ticket_id) {
      return new Response(JSON.stringify({ error: "Parametros action e ticket_id sao obrigatorios." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const { data: ticket, error: ticketErr } = await supabaseAdmin
      .from("tickets").select("id, user_id, event_id, is_blocked, ticket_code")
      .eq("id", ticket_id).single()

    if (ticketErr || !ticket) {
      return new Response(JSON.stringify({ error: "Ticket nao encontrado." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    if (!isAdmin) {
      const { data: event } = await supabaseAdmin
        .from("events").select("created_by").eq("mkt360_event_id", ticket.event_id).single()
      if (!event || event.created_by !== user.id) {
        return new Response(JSON.stringify({ error: "Sem permissoes para gerir este ticket." }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }
    }

    if (action === "block") {
      if (ticket.is_blocked) {
        return new Response(JSON.stringify({ error: "O ticket ja esta bloqueado." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }
      await supabaseAdmin.from("tickets").update({
        is_blocked: true, blocked_at: new Date().toISOString(),
        blocked_by: user.id, blocked_reason: reason || null
      }).eq("id", ticket_id)
      await supabaseAdmin.from("ticket_audit_logs").insert({
        ticket_id, event_id: ticket.event_id, action: "TICKET_BLOCKED",
        performed_by: user.id, details: { reason: reason || null, ticket_code: ticket.ticket_code }
      })
      await supabaseAdmin.from("notifications").insert({
        user_id: ticket.user_id, title: "Ticket Bloqueado",
        content: `O teu ticket #${ticket.ticket_code} foi bloqueado${reason ? `. Motivo: ${reason}` : "."}`,
        read: false, type: "ticket"
      })
      return new Response(JSON.stringify({ success: true, message: "Ticket bloqueado com sucesso." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    if (action === "unblock") {
      if (!ticket.is_blocked) {
        return new Response(JSON.stringify({ error: "O ticket nao esta bloqueado." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }
      await supabaseAdmin.from("tickets").update({
        is_blocked: false, blocked_at: null, blocked_by: null, blocked_reason: null
      }).eq("id", ticket_id)
      await supabaseAdmin.from("ticket_audit_logs").insert({
        ticket_id, event_id: ticket.event_id, action: "TICKET_UNBLOCKED",
        performed_by: user.id, details: { ticket_code: ticket.ticket_code }
      })
      await supabaseAdmin.from("notifications").insert({
        user_id: ticket.user_id, title: "Ticket Desbloqueado",
        content: `O teu ticket #${ticket.ticket_code} foi desbloqueado e ja pode ser utilizado.`,
        read: false, type: "ticket"
      })
      return new Response(JSON.stringify({ success: true, message: "Ticket desbloqueado com sucesso." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    return new Response(JSON.stringify({ error: `Acao desconhecida: ${action}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error: any) {
    console.error("[ticket-block-api] Erro:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})
