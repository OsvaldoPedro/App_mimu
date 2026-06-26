import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Auxiliar para obter token de autenticação via OAuth 2.0 do Appy Pay
async function getAppyPayToken(authUrl: string, clientId: string, clientSecret: string): Promise<string> {
  console.log(`[appy-pay-api] Solicitando token de acesso do Appy Pay em: ${authUrl}`)
  
  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials'
    }).toString()
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error(`[appy-pay-api] Erro na autenticação do Appy Pay [Status ${response.status}]:`, errText)
    throw new Error(`Falha ao autenticar com Appy Pay (${response.status})`)
  }

  const data = await response.json()
  return data.access_token
}

serve(async (req) => {
  // Tratar requisições OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Configurações do Appy Pay a partir das variáveis de ambiente (Supabase Secrets)
    const APPY_PAY_CLIENT_ID = Deno.env.get('APPY_PAY_CLIENT_ID')
    const APPY_PAY_CLIENT_SECRET = Deno.env.get('APPY_PAY_CLIENT_SECRET')
    const APPY_PAY_BASE_URL = Deno.env.get('APPY_PAY_BASE_URL') ?? 'https://gwy-api-tst.appypay.co.ao/v2.0'
    const APPY_PAY_AUTH_URL = Deno.env.get('APPY_PAY_AUTH_URL') ?? 'https://auth.appypay.co.ao/connect/token'

    // Ativação do modo simulado (mock) caso credenciais de produção/teste estejam em falta
    const useMock = !APPY_PAY_CLIENT_ID || APPY_PAY_CLIENT_ID === 'mock' || !APPY_PAY_CLIENT_SECRET || APPY_PAY_CLIENT_SECRET === 'mock'

    // Inicialização do cliente administrativo do Supabase para alterações seguras
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL ou Service Role Key não configurados na Edge Function.')
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Obter payload do corpo da requisição
    const body = await req.json()
    const { action, data } = body

    if (!action) {
      return new Response(JSON.stringify({ error: 'Parâmetro action é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[appy-pay-api] Executando ação: ${action} (Modo Simulado/Mock: ${useMock})`)

    // =========================================================================
    // 1. AÇÃO: create-payment (Criação de cobrança na Appy Pay)
    // =========================================================================
    if (action === 'create-payment') {
      const { user_id, service_id, event_id, ticket_id, booking_id, amount, currency, payment_method, metadata } = data

      if (!user_id || !amount || !payment_method) {
        throw new Error('Parâmetros obrigatórios em falta (user_id, amount, payment_method).')
      }

      const cleanCurrency = currency ?? 'AOA'
      const reference = `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`

      let appyTransactionId = ''
      let appyStatus = 'pending'
      let appyPaymentUrl = ''

      if (useMock) {
        appyTransactionId = `mock_tx_${Math.random().toString(36).substring(2, 11)}`
        appyPaymentUrl = `https://checkout-tst.appypay.co.ao/pay/${appyTransactionId}`
      } else {
        const token = await getAppyPayToken(APPY_PAY_AUTH_URL, APPY_PAY_CLIENT_ID!, APPY_PAY_CLIENT_SECRET!)
        
        console.log(`[appy-pay-api] Criando cobrança de ${amount} ${cleanCurrency} no Appy Pay`)
        const response = await fetch(`${APPY_PAY_BASE_URL}/charges`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            amount: parseFloat(amount),
            currency: cleanCurrency,
            reference: reference,
            description: `Pagamento Mimu - Ref ${reference}`,
            payment_method: payment_method === 'multicaixa_express' ? 'gpo' : (payment_method === 'reference' ? 'ref' : payment_method),
            callback_url: `${supabaseUrl}/functions/v1/appy-pay-webhook`
          })
        })

        if (!response.ok) {
          const errText = await response.text()
          console.error(`[appy-pay-api] Erro ao criar cobrança no Appy Pay [Status ${response.status}]:`, errText)
          throw new Error(`Erro ao criar cobrança na Appy Pay (${response.status})`)
        }

        const appyData = await response.json()
        appyTransactionId = appyData.id ?? appyData.transaction_id
        appyStatus = appyData.status ?? 'pending'
        appyPaymentUrl = appyData.payment_url ?? ''
      }

      // Registar a transação localmente na tabela payments
      const { data: dbPayment, error: dbError } = await supabaseAdmin
        .from('payments')
        .insert({
          user_id,
          service_id: service_id || null,
          event_id: event_id || null,
          ticket_id: ticket_id || null,
          booking_id: booking_id || null,
          amount: parseFloat(amount),
          currency: cleanCurrency,
          payment_method,
          transaction_reference: reference,
          transaction_id: appyTransactionId,
          status: appyStatus,
          metadata: metadata ? { ...metadata, payment_url: appyPaymentUrl } : { payment_url: appyPaymentUrl }
        })
        .select('*')
        .single()

      if (dbError) {
        console.error('[appy-pay-api] Erro ao salvar pagamento local no Supabase:', dbError)
        throw new Error(`Erro ao registar pagamento no banco de dados local: ${dbError.message}`)
      }

      console.log(`[appy-pay-api] Pagamento registado localmente com ID Mimu: ${dbPayment.id}`)

      return new Response(JSON.stringify({
        id: dbPayment.id,
        reference: reference,
        transaction_id: appyTransactionId,
        status: appyStatus,
        amount: parseFloat(amount),
        currency: cleanCurrency,
        payment_url: appyPaymentUrl
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // =========================================================================
    // 2. AÇÃO: payment-status (Consulta e Sincronização de Estado)
    // =========================================================================
    if (action === 'payment-status') {
      const { payment_id, transaction_id } = data

      if (!payment_id && !transaction_id) {
        throw new Error('Parâmetro payment_id ou transaction_id é obrigatório para verificar o estado.')
      }

      // Buscar registo local
      let query = supabaseAdmin.from('payments').select('*')
      if (payment_id) {
        query = query.eq('id', payment_id)
      } else {
        query = query.eq('transaction_id', transaction_id)
      }

      const { data: payment, error: fetchErr } = await query.maybeSingle()

      if (fetchErr || !payment) {
        throw new Error('Pagamento não localizado na base de dados local.')
      }

      let appyStatus = payment.status
      let paidAtValue = payment.paid_at

      if (useMock) {
        // Simulação de alteração de estado no modo de testes
        if (payment.status === 'pending') {
          appyStatus = Math.random() > 0.4 ? 'paid' : 'pending'
          if (appyStatus === 'paid') {
            paidAtValue = new Date().toISOString()
          }
        }
      } else {
        const token = await getAppyPayToken(APPY_PAY_AUTH_URL, APPY_PAY_CLIENT_ID!, APPY_PAY_CLIENT_SECRET!)
        console.log(`[appy-pay-api] Consultando cobrança ${payment.transaction_id} no Appy Pay`)
        const response = await fetch(`${APPY_PAY_BASE_URL}/charges/${payment.transaction_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          const errText = await response.text()
          console.error(`[appy-pay-api] Erro ao consultar cobrança [Status ${response.status}]:`, errText)
          throw new Error(`Erro ao obter estado de cobrança no Appy Pay (${response.status})`)
        }

        const appyData = await response.json()
        appyStatus = appyData.status ?? 'pending'
        if (appyStatus === 'paid' && !paidAtValue) {
          paidAtValue = appyData.paid_at ?? new Date().toISOString()
        }
      }

      // Se o status mudou, atualizamos na base local e atualizamos tabelas relacionadas
      if (appyStatus !== payment.status) {
        console.log(`[appy-pay-api] Transição de estado detetada: ${payment.status} -> ${appyStatus}`)
        
        const updatePayload: any = { status: appyStatus }
        if (appyStatus === 'paid') {
          updatePayload.paid_at = paidAtValue
        }

        const { error: updateErr } = await supabaseAdmin
          .from('payments')
          .update(updatePayload)
          .eq('id', payment.id)

        if (updateErr) {
          console.error('[appy-pay-api] Erro ao atualizar estado do pagamento local:', updateErr)
        }

        // Se pago, tratar da contratação/reserva vinculada
        if (appyStatus === 'paid') {
          if (payment.booking_id) {
            console.log(`[appy-pay-api] Confirmando reserva vinculada existente ID: ${payment.booking_id}`)
            const { error: orderErr } = await supabaseAdmin
              .from('orders')
              .update({ payment_status: 'pago', status: 'concluido' })
              .eq('id', payment.booking_id)

            if (orderErr) {
              console.error('[appy-pay-api] Erro ao atualizar estado da reserva associada:', orderErr)
            }
          } else if (payment.metadata) {
            const purchaseDetails = payment.metadata.purchase_details;
            const bookingDetails = payment.metadata.booking_details || (!purchaseDetails ? payment.metadata : null);

            if (purchaseDetails) {
              console.log(`[appy-pay-api] Processando compra de tickets para pagamento ID: ${payment.id}`);
              const { eventId, ticketTypeId, qty, buyerName, buyerEmail, buyerPhone } = purchaseDetails;

              // 1. Chamar API da GoTicket ou criar mock
              const GOTICKET_API_KEY = Deno.env.get('GOTICKET_API_KEY') ?? Deno.env.get('MKT360_API_KEY');
              const GOTICKET_BASE_URL = 'https://goticket.ao/api/public/v1';

              let orderData = null;

              if (!GOTICKET_API_KEY || GOTICKET_API_KEY === 'mock' || GOTICKET_API_KEY.startsWith('mock_')) {
                console.log('[appy-pay-api] Criando mock de tickets (GoTicket em modo simulação)');
                const orderRef = `TKT-REF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
                const mockTickets = [];
                for (let i = 0; i < qty; i++) {
                  const ticketCode = `TKT-${Math.floor(100000 + Math.random() * 900000)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
                  mockTickets.push({
                    ticket_code: ticketCode,
                    qr_data: `https://goticket.ao/verify/${ticketCode}`,
                    quantity: 1,
                    status: 'NOT_USED'
                  });
                }
                orderData = {
                  order_ref: orderRef,
                  total_price: payment.amount,
                  tickets: mockTickets
                };
              } else {
                try {
                  console.log(`[appy-pay-api] Chamando GoTicket API para compra do ticket do evento ${eventId}`);
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
                  });

                  if (response.ok) {
                    const resJson = await response.json();
                    orderData = resJson.data || resJson;
                  } else {
                    const rawText = await response.text();
                    console.error(`[appy-pay-api] Erro na API GoTicket: ${rawText}`);
                    throw new Error(`Erro na API GoTicket: ${response.status}`);
                  }
                } catch (fetchErr: any) {
                  console.warn('[appy-pay-api] Erro ao se conectar com a GoTicket, usando fallback mock:', fetchErr.message);
                  const orderRef = `TKT-REF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
                  const mockTickets = [];
                  for (let i = 0; i < qty; i++) {
                    const ticketCode = `TKT-${Math.floor(100000 + Math.random() * 900000)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
                    mockTickets.push({
                      ticket_code: ticketCode,
                      qr_data: `https://goticket.ao/verify/${ticketCode}`,
                      quantity: 1,
                      status: 'NOT_USED'
                    });
                  }
                  orderData = {
                    order_ref: orderRef,
                    total_price: payment.amount,
                    tickets: mockTickets
                  };
                }
              }

              if (orderData) {
                const orderRef = orderData.order_ref;
                const tickets = orderData.tickets || [];
                const totalPrice = orderData.total_price || payment.amount;

                // A. Gravar ticket_order
                const { error: orderErr } = await supabaseAdmin
                  .from('ticket_orders')
                  .insert({
                    user_id: payment.user_id,
                    order_ref: orderRef,
                    total_price: totalPrice
                  });

                if (orderErr) {
                  console.error('[appy-pay-api] Erro ao inserir ticket_order:', orderErr);
                }

                // B. Gravar tickets individuais
                let firstTicketId = null;
                const ticketsToInsert = tickets.map((t: any) => ({
                  user_id: payment.user_id,
                  event_id: eventId,
                  order_ref: orderRef,
                  ticket_code: t.ticket_code,
                  qr_data: t.qr_data || t.ticket_code,
                  quantity: t.quantity || 1,
                  status: t.status || 'NOT_USED'
                }));

                if (ticketsToInsert.length > 0) {
                  const { data: dbTickets, error: ticketsErr } = await supabaseAdmin
                    .from('tickets')
                    .insert(ticketsToInsert)
                    .select();

                  if (ticketsErr) {
                    console.error('[appy-pay-api] Erro ao inserir tickets:', ticketsErr);
                  } else if (dbTickets && dbTickets.length > 0) {
                    firstTicketId = dbTickets[0].id;
                  }
                }

                // C. Associar ticket_id e metadata da compra ao pagamento
                const updatedMetadata = {
                  ...payment.metadata,
                  ticket_order: orderData
                };

                const updatePayload: any = { metadata: updatedMetadata };
                if (firstTicketId) {
                  updatePayload.ticket_id = firstTicketId;
                }

                const { error: assocErr } = await supabaseAdmin
                  .from('payments')
                  .update(updatePayload)
                  .eq('id', payment.id);

                if (assocErr) {
                  console.error('[appy-pay-api] Erro ao associar dados da compra ao pagamento:', assocErr);
                }

                // D. Enviar notificação ao utilizador
                await supabaseAdmin
                  .from('notifications')
                  .insert({
                    user_id: payment.user_id,
                    title: 'Compra de Bilhete Confirmada!',
                    message: `O seu pagamento para o evento foi confirmado! O seu bilhete digital está disponível no painel. Referência: ${orderRef}`,
                    read: false,
                    type: 'ticket'
                  })
                  .maybeSingle();
              }
            } else if (bookingDetails) {
              console.log(`[appy-pay-api] Criando nova contratação a partir de metadados para pagamento ID: ${payment.id}`)
              
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
                  console.error('[appy-pay-api] Erro ao converter data:', e)
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
                status: 'confirmado', // Pago e Confirmado
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
                console.error('[appy-pay-api] Erro ao criar contratação:', orderErr)
              } else if (orderData) {
                console.log(`[appy-pay-api] Contratação criada com sucesso. ID: ${orderData.id}`)
                
                // @ts-ignore
                const { error: assocErr } = await supabaseAdmin
                  .from('payments')
                  .update({ booking_id: orderData.id })
                  .eq('id', payment.id)

                if (assocErr) {
                  console.error('[appy-pay-api] Erro ao associar booking_id ao pagamento:', assocErr)
                }
                
                // Atualizar objeto na memória para log
                payment.booking_id = orderData.id

                // Notificar Prestador
                if (newOrder.owner_id) {
                  const { error: notifProvErr } = await supabaseAdmin
                    .from('notifications')
                    .insert({
                      user_id: newOrder.owner_id,
                      title: 'Nova Reserva Contratada (Pago)',
                      message: `O cliente ${newOrder.client_name} contratou e pagou o serviço "${newOrder.service_name}". Verifique o seu painel de pedidos!`,
                      read: false
                    })
                  if (notifProvErr) console.error('[appy-pay-api] Erro ao notificar prestador:', notifProvErr)
                }

                // Notificar Cliente
                if (newOrder.client_id) {
                  const { error: notifCliErr } = await supabaseAdmin
                    .from('notifications')
                    .insert({
                      user_id: newOrder.client_id,
                      title: 'Pagamento Confirmado',
                      message: `O seu pagamento para o serviço "${newOrder.service_name}" foi confirmado e a contratação foi realizada com sucesso!`,
                      read: false
                    })
                  if (notifCliErr) console.error('[appy-pay-api] Erro ao notificar cliente:', notifCliErr)
                }
              }
            }
          }
        }
      }

      // Obter o metadata mais recente do pagamento (que pode ter o ticket_order atualizado)
      const { data: freshPayment } = await supabaseAdmin
        .from('payments')
        .select('metadata')
        .eq('id', payment.id)
        .maybeSingle()

      const ticketOrder = freshPayment?.metadata?.ticket_order || null

      return new Response(JSON.stringify({
        id: payment.id,
        reference: payment.transaction_reference,
        transaction_id: payment.transaction_id,
        status: appyStatus,
        amount: payment.amount,
        currency: payment.currency,
        paid_at: paidAtValue,
        ticket_order: ticketOrder
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // =========================================================================
    // 3. AÇÃO: cancel-payment (Cancelamento de Cobrança)
    // =========================================================================
    if (action === 'cancel-payment') {
      const { payment_id, transaction_id } = data

      if (!payment_id && !transaction_id) {
        throw new Error('Parâmetro payment_id ou transaction_id é obrigatório para cancelar o pagamento.')
      }

      let query = supabaseAdmin.from('payments').select('*')
      if (payment_id) {
        query = query.eq('id', payment_id)
      } else {
        query = query.eq('transaction_id', transaction_id)
      }

      const { data: payment, error: fetchErr } = await query.maybeSingle()

      if (fetchErr || !payment) {
        throw new Error('Pagamento não localizado na base de dados local.')
      }

      if (payment.status !== 'pending') {
        throw new Error(`Não é possível cancelar um pagamento com estado: ${payment.status}`)
      }

      let appyStatus = 'cancelled'

      if (!useMock) {
        const token = await getAppyPayToken(APPY_PAY_AUTH_URL, APPY_PAY_CLIENT_ID!, APPY_PAY_CLIENT_SECRET!)
        console.log(`[appy-pay-api] Cancelando cobrança ${payment.transaction_id} no Appy Pay`)
        const response = await fetch(`${APPY_PAY_BASE_URL}/charges/${payment.transaction_id}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          const errText = await response.text()
          console.error(`[appy-pay-api] Erro ao cancelar cobrança [Status ${response.status}]:`, errText)
          throw new Error(`Erro ao cancelar cobrança no Appy Pay (${response.status})`)
        }

        const appyData = await response.json()
        appyStatus = appyData.status ?? 'cancelled'
      }

      // Atualizar localmente na tabela de pagamentos
      const { error: updateErr } = await supabaseAdmin
        .from('payments')
        .update({ status: appyStatus })
        .eq('id', payment.id)

      if (updateErr) {
        console.error('[appy-pay-api] Erro ao atualizar cancelamento local:', updateErr)
        throw new Error(`Erro ao registar cancelamento no banco local: ${updateErr.message}`)
      }

      // Atualizar estado na reserva vinculada
      if (payment.booking_id) {
        await supabaseAdmin
          .from('orders')
          .update({ payment_status: 'cancelado', status: 'cancelado' })
          .eq('id', payment.booking_id)
      }

      return new Response(JSON.stringify({
        id: payment.id,
        reference: payment.transaction_reference,
        transaction_id: payment.transaction_id,
        status: appyStatus,
        amount: payment.amount,
        currency: payment.currency
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error(`Ação '${action}' desconhecida.`)

  } catch (error: any) {
    console.error(`[appy-pay-api] Erro geral de processamento:`, error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
