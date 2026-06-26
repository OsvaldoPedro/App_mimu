import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Auxiliar para converter ArrayBuffer para string hex
function buf2hex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Valida a assinatura HMAC-SHA256
async function verifySignature(secret: string, signature: string, payload: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const keyBuf = encoder.encode(secret)
    const payloadBuf = encoder.encode(payload)

    const key = await crypto.subtle.importKey(
      "raw",
      keyBuf,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )

    const signatureBuf = await crypto.subtle.sign("HMAC", key, payloadBuf)
    const calculatedSignature = buf2hex(signatureBuf)

    return calculatedSignature === signature
  } catch (err) {
    console.error('[mkt360-webhook] Falha ao verificar assinatura:', err)
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const WEBHOOK_SECRET = Deno.env.get('GOTICKET_WEBHOOK_SECRET') ?? Deno.env.get('MKT360_WEBHOOK_SECRET')
    const signature = req.headers.get('X-Webhook-Signature')

    if (!WEBHOOK_SECRET) {
      throw new Error('GOTICKET_WEBHOOK_SECRET não está configurado no servidor.')
    }

    if (!signature) {
      return new Response(JSON.stringify({ error: 'Assinatura em falta (header X-Webhook-Signature).' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Obter o corpo bruto da requisição para validar a assinatura
    const rawBody = await req.text()
    
    // Validar assinatura HMAC-SHA256
    const isSignatureValid = await verifySignature(WEBHOOK_SECRET, signature, rawBody)
    if (!isSignatureValid) {
      console.warn('[mkt360-webhook] Assinatura inválida detectada.')
      return new Response(JSON.stringify({ error: 'Assinatura inválida.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parse do body agora que está validado
    const payload = JSON.parse(rawBody)
    const { event, data } = payload

    if (!event || !data) {
      return new Response(JSON.stringify({ error: 'Payload incompleto. Exige "event" e "data".' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`[mkt360-webhook] Novo evento recebido: ${event}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL ou Service Role Key não configurados na Edge Function.')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Processamento de Eventos
    let newStatus = ''
    let notificationTitle = ''
    let notificationContent = ''

    switch (event) {
      case 'ticket.purchased':
        newStatus = 'NOT_USED'
        notificationTitle = 'Novo Bilhete Disponível!'
        notificationContent = `A sua compra foi processada com sucesso e os bilhetes já estão disponíveis.`
        break

      case 'ticket.checkin':
        newStatus = 'INSIDE'
        notificationTitle = 'Check-in Realizado!'
        notificationContent = `Entrada registada para o bilhete no evento.`
        break

      case 'ticket.checkout':
        newStatus = 'OUTSIDE'
        notificationTitle = 'Check-out Realizado!'
        notificationContent = `Saída registada para o bilhete no evento.`
        break

      case 'ticket.cancelled':
        newStatus = 'CANCELLED'
        notificationTitle = 'Bilhete Cancelado!'
        notificationContent = `O seu bilhete foi cancelado pelo organizador.`
        break

      default:
        console.warn(`[mkt360-webhook] Evento ignorado: ${event}`)
        return new Response(JSON.stringify({ message: 'Evento ignorado.' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
    }

    // 1. Tratar criação e inserção em lote para compras (ticket.purchased)
    if (event === 'ticket.purchased') {
      const tickets = data.tickets || []
      const email = data.customer_email || data.buyer_email

      if (tickets.length > 0 && email) {
        // Encontrar utilizador por email
        const { data: userData } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle()

        if (userData) {
          const userId = userData.id
          const orderRef = data.order_ref || `ORD-${Date.now()}`

          // Criar a order local se não existir
          await supabaseAdmin
            .from('ticket_orders')
            .insert({
              user_id: userId,
              order_ref: orderRef,
              total_price: data.total_price || 0
            })
            .maybeSingle()

          // Inserir cada ticket individualmente se não existir
          for (const t of tickets) {
            const { data: existingTicket } = await supabaseAdmin
              .from('tickets')
              .select('id')
              .eq('ticket_code', t.ticket_code)
              .maybeSingle()

            if (!existingTicket) {
              await supabaseAdmin
                .from('tickets')
                .insert({
                  user_id: userId,
                  event_id: data.event_id,
                  order_ref: orderRef,
                  ticket_code: t.ticket_code,
                  qr_data: t.qr_data || t.ticket_code,
                  quantity: t.quantity || 1,
                  status: newStatus
                })
            }
          }

          // Criar notificação única
          await supabaseAdmin
            .from('notifications')
            .insert({
              user_id: userId,
              title: notificationTitle,
              content: notificationContent,
              read: false,
              type: 'ticket'
            })
            .maybeSingle()
        }
      }
    } else {
      // 2. Tratar eventos singulares (checkin, checkout, cancelled)
      const ticketCode = data.ticket_code
      if (ticketCode) {
        const { data: ticket } = await supabaseAdmin
          .from('tickets')
          .select('id, user_id')
          .eq('ticket_code', ticketCode)
          .maybeSingle()

        if (ticket) {
          // Atualizar o status
          await supabaseAdmin
            .from('tickets')
            .update({ status: newStatus })
            .eq('ticket_code', ticketCode)

          // Notificar o utilizador
          await supabaseAdmin
            .from('notifications')
            .insert({
              user_id: ticket.user_id,
              title: notificationTitle,
              content: `${notificationContent} Código: ${ticketCode}`,
              read: false,
              type: 'ticket'
            })
            .maybeSingle()
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error(`[mkt360-webhook] Erro:`, error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
