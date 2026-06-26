import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to convert ArrayBuffer to hex string for HMAC
function buf2hex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Validate Signature (HMAC-SHA256)
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
    console.error('[appy-pay-webhook] Erro ao verificar assinatura:', err)
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL ou Service Role Key não configurados no servidor.')
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Configurações do Segredo do Webhook da Appy Pay
    const WEBHOOK_SECRET = Deno.env.get('APPY_PAY_WEBHOOK_SECRET') ?? Deno.env.get('APPY_PAY_CLIENT_SECRET')
    const signature = req.headers.get('X-Signature') ?? req.headers.get('X-AppyPay-Signature') ?? req.headers.get('X-Webhook-Signature')

    const rawBody = await req.text()

    // Validar assinatura se o segredo estiver configurado e não for 'mock'
    if (WEBHOOK_SECRET && WEBHOOK_SECRET !== 'mock') {
      if (!signature) {
        console.warn('[appy-pay-webhook] Assinatura ausente.')
        return new Response(JSON.stringify({ error: 'Assinatura em falta.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const isValid = await verifySignature(WEBHOOK_SECRET, signature, rawBody)
      if (!isValid) {
        console.warn('[appy-pay-webhook] Assinatura inválida detectada.')
        return new Response(JSON.stringify({ error: 'Assinatura inválida.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } else {
      console.log('[appy-pay-webhook] Assinatura ignorada (modo simulação/mock ou sem segredo configurado)')
    }

    // Parse do payload
    const payload = JSON.parse(rawBody)
    console.log('[appy-pay-webhook] Payload recebido:', JSON.stringify(payload))

    // Tentar extrair dados do payload (aceitar vários formatos da Appy Pay)
    const transactionId = payload.id ?? payload.transaction_id ?? payload.data?.id
    const appyStatus = payload.status ?? payload.data?.status ?? 'pending'
    const reference = payload.reference ?? payload.data?.reference

    if (!transactionId && !reference) {
      return new Response(JSON.stringify({ error: 'Identificador de transação não localizado no payload.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Buscar o pagamento correspondente na base de dados
    let query = supabaseAdmin.from('payments').select('*')
    if (transactionId) {
      query = query.eq('transaction_id', transactionId)
    } else {
      query = query.eq('transaction_reference', reference)
    }

    const { data: payment, error: fetchErr } = await query.maybeSingle()
    const paymentId = payment?.id ?? null

    // Determinar o event_type para registo de logs
    const eventType = payload.event ?? payload.event_type ?? `payment.${appyStatus}`

    // 1. Guardar o evento na tabela payment_logs
    const { error: logErr } = await supabaseAdmin
      .from('payment_logs')
      .insert({
        payment_id: paymentId,
        payload: payload,
        event_type: eventType
      })

    if (logErr) {
      console.error('[appy-pay-webhook] Erro ao gravar em payment_logs:', logErr)
    }

    if (!payment) {
      console.warn(`[appy-pay-webhook] Pagamento não localizado para a transação ${transactionId || reference}. Log gravado sem referência.`)
      return new Response(JSON.stringify({ message: 'Log gravado, mas pagamento não localizado na base local.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Atualizar estado do pagamento se mudou
    if (appyStatus !== payment.status) {
      console.log(`[appy-pay-webhook] Mudança de estado detetada para pagamento ${payment.id}: ${payment.status} -> ${appyStatus}`)
      
      const updatePayload: any = { status: appyStatus }
      if (appyStatus === 'paid') {
        updatePayload.paid_at = payload.paid_at ?? new Date().toISOString()
      }

      const { error: updateErr } = await supabaseAdmin
        .from('payments')
        .update(updatePayload)
        .eq('id', payment.id)

      if (updateErr) {
        console.error('[appy-pay-webhook] Erro ao atualizar pagamento local:', updateErr)
        throw new Error(`Erro ao atualizar pagamento: ${updateErr.message}`)
      }

      // 3. Processamento pós-pagamento se o estado mudar para 'paid'
      if (appyStatus === 'paid') {
        if (payment.booking_id) {
          console.log(`[appy-pay-webhook] Confirmando reserva vinculada ID: ${payment.booking_id}`)
          const { error: orderErr } = await supabaseAdmin
            .from('orders')
            .update({ payment_status: 'pago', status: 'concluido' })
            .eq('id', payment.booking_id)

          if (orderErr) {
            console.error('[appy-pay-webhook] Erro ao atualizar reserva vinculada:', orderErr)
          }
        } else if (payment.metadata) {
          const purchaseDetails = payment.metadata.purchase_details
          const bookingDetails = payment.metadata.booking_details || (!purchaseDetails ? payment.metadata : null)

          // 3a. Processar depósito de carteira
          if (payment.metadata?.type === 'wallet_deposit' && payment.metadata?.wallet_id) {
            const walletId = payment.metadata.wallet_id
            console.log(`[appy-pay-webhook] Confirmando depósito de carteira para wallet_id: ${walletId}`)

            const { data: wallet, error: walletErr } = await supabaseAdmin
              .from('wallets')
              .select('*')
              .eq('id', walletId)
              .maybeSingle()

            if (walletErr || !wallet) {
              console.error('[appy-pay-webhook] Carteira não encontrada para o depósito:', walletErr)
            } else {
              const newBalance = parseFloat((parseFloat(wallet.balance) + parseFloat(payment.amount)).toFixed(2))

              // Atualizar saldo da carteira
              const { error: balanceErr } = await supabaseAdmin
                .from('wallets')
                .update({ balance: newBalance })
                .eq('id', walletId)

              if (balanceErr) {
                console.error('[appy-pay-webhook] Erro ao atualizar saldo da carteira:', balanceErr)
              } else {
                // Atualizar transação pendente para completed
                await supabaseAdmin
                  .from('wallet_transactions')
                  .update({
                    status: 'completed',
                    balance_after: newBalance
                  })
                  .eq('related_payment_id', payment.id)
                  .eq('type', 'deposit')

                // Notificação
                await supabaseAdmin.from('notifications').insert({
                  user_id: payment.user_id,
                  title: '✅ Depósito Confirmado',
                  message: `O seu depósito de ${parseFloat(payment.amount).toFixed(2)} AOA foi confirmado! O seu saldo na carteira Mimu foi atualizado.`,
                  read: false
                })

                console.log(`[appy-pay-webhook] Depósito confirmado. Novo saldo: ${newBalance} AOA`)
              }
            }
          }
          
          // 3b. Processar compra de Tickets
          else if (purchaseDetails) {
            console.log(`[appy-pay-webhook] Processando tickets para pagamento ID: ${payment.id}`)
            const { eventId, ticketTypeId, qty, buyerName, buyerEmail, buyerPhone } = purchaseDetails

            const GOTICKET_API_KEY = Deno.env.get('GOTICKET_API_KEY') ?? Deno.env.get('MKT360_API_KEY')
            const GOTICKET_BASE_URL = 'https://goticket.ao/api/public/v1'

            let orderData = null

            // Modo simulação ou chamada GoTicket
            if (!GOTICKET_API_KEY || GOTICKET_API_KEY === 'mock' || GOTICKET_API_KEY.startsWith('mock_')) {
              console.log('[appy-pay-webhook] Gerando mock de tickets')
              const orderRef = `TKT-REF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
              const mockTickets = []
              for (let i = 0; i < qty; i++) {
                const ticketCode = `TKT-${Math.floor(100000 + Math.random() * 900000)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`
                mockTickets.push({
                  ticket_code: ticketCode,
                  qr_data: `https://goticket.ao/verify/${ticketCode}`,
                  quantity: 1,
                  status: 'NOT_USED'
                })
              }
              orderData = {
                order_ref: orderRef,
                total_price: payment.amount,
                tickets: mockTickets
              }
            } else {
              try {
                const response = await fetch(`${GOTICKET_BASE_URL}/tickets/purchase`, {
                  method: 'POST',
                  headers: {
                    'X-API-Key': GOTICKET_API_KEY,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  body: JSON.stringify({
                    event_id: eventId,
                    ticket_type_id: ticketTypeId,
                    customer_name: buyerName,
                    customer_email: buyerEmail,
                    customer_phone: buyerPhone,
                    quantity: qty
                  })
                })

                if (response.ok) {
                  const resJson = await response.json()
                  orderData = resJson.data || resJson
                } else {
                  console.error('[appy-pay-webhook] Erro ao chamar API externa do GoTicket.')
                }
              } catch (fetchErr) {
                console.error('[appy-pay-webhook] Erro de rede ao ligar ao GoTicket, aplicando fallback mock:', fetchErr)
                const orderRef = `TKT-REF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
                const mockTickets = []
                for (let i = 0; i < qty; i++) {
                  const ticketCode = `TKT-${Math.floor(100000 + Math.random() * 900000)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`
                  mockTickets.push({
                    ticket_code: ticketCode,
                    qr_data: `https://goticket.ao/verify/${ticketCode}`,
                    quantity: 1,
                    status: 'NOT_USED'
                  })
                }
                orderData = {
                  order_ref: orderRef,
                  total_price: payment.amount,
                  tickets: mockTickets
                }
              }
            }

            if (orderData) {
              const orderRef = orderData.order_ref
              const tickets = orderData.tickets || []
              const totalPrice = orderData.total_price || payment.amount

              // Gravar ticket_order
              await supabaseAdmin
                .from('ticket_orders')
                .insert({
                  user_id: payment.user_id,
                  order_ref: orderRef,
                  total_price: totalPrice
                })

              // Gravar tickets individuais
              let firstTicketId = null
              const ticketsToInsert = tickets.map((t: any) => ({
                user_id: payment.user_id,
                event_id: eventId,
                order_ref: orderRef,
                ticket_code: t.ticket_code,
                qr_data: t.qr_data || t.ticket_code,
                quantity: t.quantity || 1,
                status: t.status || 'NOT_USED'
              }))

              if (ticketsToInsert.length > 0) {
                const { data: dbTickets, error: ticketsErr } = await supabaseAdmin
                  .from('tickets')
                  .insert(ticketsToInsert)
                  .select()

                if (ticketsErr) {
                  console.error('[appy-pay-webhook] Erro ao inserir tickets:', ticketsErr)
                } else if (dbTickets && dbTickets.length > 0) {
                  firstTicketId = dbTickets[0].id
                }
              }

              // Associar ticket_id e metadata
              const updatedMetadata = {
                ...payment.metadata,
                ticket_order: orderData
              }

              const assocPayload: any = { metadata: updatedMetadata }
              if (firstTicketId) {
                assocPayload.ticket_id = firstTicketId
              }

              await supabaseAdmin
                .from('payments')
                .update(assocPayload)
                .eq('id', payment.id)

              // Notificação
              await supabaseAdmin
                .from('notifications')
                .insert({
                  user_id: payment.user_id,
                  title: 'Compra de Bilhete Confirmada!',
                  message: `O seu pagamento para o evento foi confirmado! O seu bilhete digital está disponível no painel. Referência: ${orderRef}`,
                  read: false,
                  type: 'ticket'
                })
            }
          }

          // 3b. Processar reserva de Serviço (Se criado dinamicamente)
          else if (bookingDetails) {
            console.log(`[appy-pay-webhook] Criando nova contratação para pagamento ID: ${payment.id}`)
            
            let dbDate = null
            if (bookingDetails.date && bookingDetails.date !== '-') {
              try {
                if (bookingDetails.date.includes('/')) {
                  const parts = bookingDetails.date.split('/')
                  dbDate = `${parts[2]}-${parts[1]}-${parts[0]}`
                } else {
                  dbDate = new Date(bookingDetails.date).toISOString().split('T')[0]
                }
              } catch (e) {
                console.error('[appy-pay-webhook] Erro ao formatar data:', e)
                dbDate = bookingDetails.date
              }
            }

            const newOrder = {
              client_id: bookingDetails.clientId || payment.user_id,
              owner_id: bookingDetails.providerId || bookingDetails.companyId,
              service_id: bookingDetails.serviceId || payment.service_id,
              client_name: bookingDetails.clientName || 'Cliente',
              service_name: bookingDetails.serviceName || 'Serviço',
              date: dbDate,
              time: bookingDetails.time === '-' ? null : (bookingDetails.time || null),
              status: 'confirmado',
              total: bookingDetails.total || payment.amount,
              payment_method: payment.payment_method || 'Appy Pay',
              payment_status: 'pago',
              guests: bookingDetails.guests || null,
              special_requests: bookingDetails.specialRequests || null
            }

            const { data: orderData, error: orderErr } = await supabaseAdmin
              .from('orders')
              .insert(newOrder)
              .select()
              .single()

            if (orderErr) {
              console.error('[appy-pay-webhook] Erro ao criar contratação:', orderErr)
            } else if (orderData) {
              await supabaseAdmin
                .from('payments')
                .update({ booking_id: orderData.id })
                .eq('id', payment.id)

              // Notificar Prestador
              if (newOrder.owner_id) {
                await supabaseAdmin
                  .from('notifications')
                  .insert({
                    user_id: newOrder.owner_id,
                    title: 'Nova Reserva Contratada (Pago)',
                    message: `O cliente ${newOrder.client_name} contratou e pagou o serviço "${newOrder.service_name}". Verifique o seu painel de pedidos!`,
                    read: false
                  })
              }

              // Notificar Cliente
              if (newOrder.client_id) {
                await supabaseAdmin
                  .from('notifications')
                  .insert({
                    user_id: newOrder.client_id,
                    title: 'Pagamento Confirmado',
                    message: `O seu pagamento para o serviço "${newOrder.service_name}" foi confirmado e a contratação foi realizada com sucesso!`,
                    read: false
                  })
              }
            }
          }
        }
      }

      // 4. Se o estado mudar para cancelado, falhado ou expirado
      else if (appyStatus === 'cancelled' || appyStatus === 'failed' || appyStatus === 'expired') {
        if (payment.booking_id) {
          console.log(`[appy-pay-webhook] Cancelando reserva associada ID: ${payment.booking_id}`)
          await supabaseAdmin
            .from('orders')
            .update({ payment_status: 'cancelado', status: 'cancelado' })
            .eq('id', payment.booking_id)
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error(`[appy-pay-webhook] Erro geral:`, error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
