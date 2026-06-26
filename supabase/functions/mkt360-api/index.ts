import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Auxiliar para fazer fetch seguro na GoTicket e tratar erros de manutenção/HTML
async function safeMKT360Fetch(url: string, options: any) {
  const response = await fetch(url, options)
  const contentType = response.headers.get('content-type') || ''
  
  if (contentType.includes('application/json')) {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || data.error || `A API GoTicket retornou código de erro: ${response.status}`)
    }
    return data
  } else {
    const rawText = await response.text()
    console.warn(`[mkt360-api] Resposta não-JSON recebida de ${url} [Status: ${response.status}]:`, rawText.substring(0, 150))
    
    // Identifica se o site está em manutenção / under construction
    if (rawText.toLowerCase().includes('under construction') || rawText.toLowerCase().includes('manutenção') || response.status === 404) {
      throw new Error('O servidor de bilhetes da GoTicket encontra-se temporariamente em manutenção. Por favor, tente mais tarde.')
    }
    
    throw new Error(`Erro inesperado no servidor de bilhetes (${response.status}).`)
  }
}

serve(async (req) => {
  // Tratar requisição OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const GOTICKET_API_KEY = Deno.env.get('GOTICKET_API_KEY') ?? Deno.env.get('MKT360_API_KEY')
    const GOTICKET_BASE_URL = 'https://goticket.ao/api/public/v1'

    if (!GOTICKET_API_KEY) {
      throw new Error('GOTICKET_API_KEY não está configurada no servidor.')
    }

    // Identificar o utilizador do Supabase caso a requisição venha autenticada
    const authHeader = req.headers.get('Authorization')
    let user = null
    let supabaseAdmin = null

    if (authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      
      const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
        global: { headers: { Authorization: authHeader } }
      })
      
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser()
      if (!authError && authUser) {
        user = authUser
      }

      if (supabaseUrl && supabaseServiceKey) {
        supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
      }
    }

    // Obter payload do body
    const body = await req.json()
    const { action, data } = body

    if (!action) {
      return new Response(JSON.stringify({ error: 'Parâmetro action é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[mkt360-api] Processando ação: ${action}`)

    // 1. Listar eventos futuros
    if (action === 'list-events') {
      const result = await safeMKT360Fetch(`${GOTICKET_BASE_URL}/events?upcoming=1`, {
        method: 'GET',
        headers: {
          'X-API-Key': GOTICKET_API_KEY,
          'Accept': 'application/json'
        }
      })
      
      return new Response(JSON.stringify(result?.data || result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Obter detalhes de um evento
    if (action === 'get-event-details') {
      const eventId = data?.eventId
      if (!eventId) {
        throw new Error('eventId é obrigatório para obter detalhes do evento.')
      }

      const result = await safeMKT360Fetch(`${GOTICKET_BASE_URL}/events/${eventId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': GOTICKET_API_KEY,
          'Accept': 'application/json'
        }
      })
      
      return new Response(JSON.stringify(result?.data || result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Requisitos para ações que exigem autenticação do utilizador Mimu
    if (!user) {
      return new Response(JSON.stringify({ error: 'Não autorizado. Inicie sessão para continuar.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Compra de Tickets
    if (action === 'purchase-tickets') {
      const { eventId, ticketTypeId, qty, buyerName, buyerEmail, buyerPhone } = data

      if (!eventId || !ticketTypeId || !qty || !buyerName || !buyerEmail) {
        throw new Error('Campos de compra incompletos (eventId, ticketTypeId, qty, buyerName, buyerEmail).')
      }

      console.log(`[mkt360-api] Solicitando compra de ticket para o utilizador: ${user.id}`)

      // Fazer pedido de compra para a GoTicket
      const result = await safeMKT360Fetch(`${GOTICKET_BASE_URL}/tickets/purchase`, {
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

      // Integrar localmente se a API retornou sucesso e possuímos o Supabase Admin
      const orderData = result?.data || result
      if (supabaseAdmin && orderData) {
        const orderRef = orderData.order_ref
        const tickets = orderData.tickets || []
        const totalPrice = orderData.total_price || 0

        // Inserir Order localmente
        const { error: orderErr } = await supabaseAdmin
          .from('ticket_orders')
          .insert({
            user_id: user.id,
            order_ref: orderRef,
            total_price: totalPrice
          })

        if (orderErr) {
          console.error('[mkt360-api] Erro ao gravar order local:', orderErr)
        } else {
          // Inserir cada ticket localmente
          const ticketsToInsert = tickets.map((t: any) => ({
            user_id: user.id,
            event_id: eventId,
            order_ref: orderRef,
            ticket_code: t.ticket_code,
            qr_data: t.qr_data || t.ticket_code,
            quantity: t.quantity || 1,
            status: t.status || 'NOT_USED'
          }))

          if (ticketsToInsert.length > 0) {
            const { error: ticketsErr } = await supabaseAdmin
              .from('tickets')
              .insert(ticketsToInsert)

            if (ticketsErr) {
              console.error('[mkt360-api] Erro ao gravar tickets locais:', ticketsErr)
            }
          }

          // Criar uma notificação
          await supabaseAdmin
            .from('notifications')
            .insert({
              user_id: user.id,
              title: 'Compra de Bilhete Confirmada!',
              content: `A sua compra para o evento GoTicket foi processada com sucesso. Referência: ${orderRef}`,
              read: false,
              type: 'ticket'
            })
            .maybeSingle()
        }
      }

      return new Response(JSON.stringify(orderData), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. Validar Ticket
    if (action === 'validate-ticket') {
      const { ticketCode, eventId } = data
      if (!ticketCode) {
        throw new Error('ticketCode é obrigatório para validação.')
      }

      // CONSULTAR TICKET LOCALMENTE PRIMEIRO
      if (supabaseAdmin) {
        const { data: ticket, error: ticketErr } = await supabaseAdmin
          .from('tickets')
          .select('id, event_id, is_blocked, status')
          .eq('ticket_code', ticketCode)
          .maybeSingle()

        if (ticket && ticket.is_blocked) {
          // Registar tentativa no log
          await supabaseAdmin
            .from('ticket_audit_logs')
            .insert({
              ticket_id: ticket.id,
              event_id: ticket.event_id,
              action: 'BLOCKED_VALIDATION_ATTEMPT',
              performed_by: user ? user.id : ticket.user_id || ticket.blocked_by || '00000000-0000-0000-0000-000000000000',
              details: { ticket_code: ticketCode, event_id: eventId }
            })
            .maybeSingle()

          return new Response(JSON.stringify({
            success: false,
            code: 'TICKET_BLOCKED',
            error: 'Este ticket foi bloqueado pelo organizador.',
            message: 'Este ticket foi bloqueado pelo organizador.'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      const result = await safeMKT360Fetch(`${GOTICKET_BASE_URL}/tickets/validate`, {
        method: 'POST',
        headers: {
          'X-API-Key': GOTICKET_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ticket_code: ticketCode,
          event_id: eventId
        })
      })

      return new Response(JSON.stringify(result?.data || result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 5. Registrar Check-in (Portaria)
    if (action === 'checkin') {
      const { ticketCode, eventId } = data
      if (!ticketCode) {
        throw new Error('ticketCode é obrigatório para o check-in.')
      }

      // Validar se o utilizador atual tem permissões para fazer check-in
      let isAuthorized = false
      if (supabaseAdmin) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile && (profile.role === 'provider' || profile.role === 'company' || profile.role === 'admin')) {
          isAuthorized = true
        }
      }

      if (!isAuthorized) {
        return new Response(JSON.stringify({ error: 'Não autorizado. Apenas organizadores podem validar portaria.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // CONSULTAR SE O TICKET ESTÁ BLOQUEADO LOCALMENTE
      if (supabaseAdmin) {
        const { data: ticket, error: ticketErr } = await supabaseAdmin
          .from('tickets')
          .select('id, event_id, is_blocked, status')
          .eq('ticket_code', ticketCode)
          .maybeSingle()

        if (ticket && ticket.is_blocked) {
          // Registar tentativa no log
          await supabaseAdmin
            .from('ticket_audit_logs')
            .insert({
              ticket_id: ticket.id,
              event_id: ticket.event_id,
              action: 'BLOCKED_CHECKIN_ATTEMPT',
              performed_by: user.id,
              details: { ticket_code: ticketCode, event_id: eventId }
            })
            .maybeSingle()

          return new Response(JSON.stringify({
            success: false,
            code: 'CHECKIN_BLOCKED',
            error: 'Este ticket encontra-se bloqueado.',
            message: 'Este ticket encontra-se bloqueado.'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      const result = await safeMKT360Fetch(`${GOTICKET_BASE_URL}/checkin`, {
        method: 'POST',
        headers: {
          'X-API-Key': GOTICKET_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ticket_code: ticketCode,
          event_id: eventId
        })
      })

      if (supabaseAdmin) {
        // Atualizar status do ticket na base local para 'INSIDE'
        const { data: updatedTicket, error: ticketErr } = await supabaseAdmin
          .from('tickets')
          .update({ status: 'INSIDE' })
          .eq('ticket_code', ticketCode)
          .select('user_id')
          .maybeSingle()

        if (updatedTicket) {
          // Criar notificação para o participante
          await supabaseAdmin
            .from('notifications')
            .insert({
              user_id: updatedTicket.user_id,
              title: 'Check-in Realizado!',
              content: `O seu bilhete (${ticketCode}) foi validado na entrada do evento.`,
              read: false,
              type: 'ticket'
            })
            .maybeSingle()
        }
      }

      return new Response(JSON.stringify(result?.data || result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 6. Bloquear Ticket
    if (action === 'block-ticket') {
      const { ticketId, reason } = data
      if (!ticketId || !reason) {
        throw new Error('ticketId e reason são obrigatórios para bloquear o ticket.')
      }

      if (!supabaseAdmin) {
        throw new Error('Erro de configuração do servidor de banco de dados.')
      }

      // Verificar se o ticket existe
      const { data: ticket, error: ticketErr } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .maybeSingle()

      if (ticketErr || !ticket) {
        throw new Error('Ticket não encontrado.')
      }

      // Verificar se não está cancelado
      if (ticket.status === 'CANCELLED') {
        throw new Error('Não é possível bloquear um ticket cancelado.')
      }

      // Verificar se o utilizador é o criador do evento ou admin
      const { data: event, error: eventErr } = await supabaseAdmin
        .from('events')
        .select('created_by')
        .eq('mkt360_event_id', ticket.event_id)
        .maybeSingle()

      if (eventErr || !event) {
        throw new Error('Evento associado não encontrado.')
      }

      let isAllowed = false
      if (user) {
        if (event.created_by === user.id) {
          isAllowed = true
        } else {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
          
          if (profile && profile.role === 'admin') {
            isAllowed = true
          }
        }
      }

      if (!isAllowed) {
        return new Response(JSON.stringify({ error: 'Acesso negado. Apenas o criador do evento ou administradores podem bloquear tickets.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Executar bloqueio
      const { error: updateErr } = await supabaseAdmin
        .from('tickets')
        .update({
          is_blocked: true,
          blocked_at: new Date().toISOString(),
          blocked_by: user.id,
          blocked_reason: reason
        })
        .eq('id', ticketId)

      if (updateErr) {
        throw new Error(`Erro ao atualizar o ticket: ${updateErr.message}`)
      }

      // Registrar log de auditoria
      await supabaseAdmin
        .from('ticket_audit_logs')
        .insert({
          ticket_id: ticketId,
          event_id: ticket.event_id,
          action: 'TICKET_BLOCKED',
          performed_by: user.id,
          details: { reason, blocked_at: new Date().toISOString() }
        })
        .maybeSingle()

      // Criar notificação
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: ticket.user_id,
          title: 'Ticket Bloqueado',
          content: `O organizador bloqueou temporariamente o seu ticket. Motivo: ${reason}`,
          read: false,
          type: 'ticket'
        })
        .maybeSingle()

      return new Response(JSON.stringify({ success: true, message: 'Ticket bloqueado com sucesso.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 7. Desbloquear Ticket
    if (action === 'unblock-ticket') {
      const { ticketId } = data
      if (!ticketId) {
        throw new Error('ticketId é obrigatório para desbloquear o ticket.')
      }

      if (!supabaseAdmin) {
        throw new Error('Erro de configuração do servidor de banco de dados.')
      }

      // Verificar se o ticket existe
      const { data: ticket, error: ticketErr } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .maybeSingle()

      if (ticketErr || !ticket) {
        throw new Error('Ticket não encontrado.')
      }

      // Verificar se o utilizador é o criador do evento ou admin
      const { data: event, error: eventErr } = await supabaseAdmin
        .from('events')
        .select('created_by')
        .eq('mkt360_event_id', ticket.event_id)
        .maybeSingle()

      if (eventErr || !event) {
        throw new Error('Evento associado não encontrado.')
      }

      let isAllowed = false
      if (user) {
        if (event.created_by === user.id) {
          isAllowed = true
        } else {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
          
          if (profile && profile.role === 'admin') {
            isAllowed = true
          }
        }
      }

      if (!isAllowed) {
        return new Response(JSON.stringify({ error: 'Acesso negado. Apenas o criador do evento ou administradores podem desbloquear tickets.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Executar desbloqueio
      const { error: updateErr } = await supabaseAdmin
        .from('tickets')
        .update({
          is_blocked: false,
          blocked_at: null,
          blocked_by: null,
          blocked_reason: null
        })
        .eq('id', ticketId)

      if (updateErr) {
        throw new Error(`Erro ao atualizar o ticket: ${updateErr.message}`)
      }

      // Registrar log de auditoria
      await supabaseAdmin
        .from('ticket_audit_logs')
        .insert({
          ticket_id: ticketId,
          event_id: ticket.event_id,
          action: 'TICKET_UNBLOCKED',
          performed_by: user.id,
          details: { unblocked_at: new Date().toISOString() }
        })
        .maybeSingle()

      // Criar notificação
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: ticket.user_id,
          title: 'Ticket Desbloqueado',
          content: 'O seu ticket voltou a estar disponível para utilização.',
          read: false,
          type: 'ticket'
        })
        .maybeSingle()

      return new Response(JSON.stringify({ success: true, message: 'Ticket desbloqueado com sucesso.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 8. Criar Evento e Lotes no GoTicket
    if (action === 'create-event') {
      const { title, description, location, date, ticket_types, image_url } = data

      if (!title || !description || !location || !date) {
        throw new Error('Campos obrigatórios em falta (title, description, location, date).')
      }

      console.log(`[mkt360-api] Solicitando criação de evento no GoTicket para o utilizador: ${user.id}`)

      let resultData;
      
      // Fallback/Mock se a chave de API for 'mock' ou se o request falhar
      if (!GOTICKET_API_KEY || GOTICKET_API_KEY === 'mock' || GOTICKET_API_KEY.startsWith('mock_')) {
        console.log('[mkt360-api] Usando modo Mock para criação de evento.')
        const mockEventId = Math.floor(100000 + Math.random() * 900000)
        resultData = {
          success: true,
          event_id: mockEventId,
          title,
          description,
          location,
          date,
          image_url,
          ticket_types: (ticket_types || []).map((t: any, index: number) => ({
            id: `tkt_type_${index}_${Date.now()}`,
            name: t.name || 'Geral',
            price: t.price || '0',
            quantity: t.quantity || 100,
            description: t.description || ''
          }))
        }
      } else {
        try {
          const result = await safeMKT360Fetch(`${GOTICKET_BASE_URL}/events`, {
            method: 'POST',
            headers: {
              'X-API-Key': GOTICKET_API_KEY,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              title,
              description,
              location,
              date,
              ticket_types: ticket_types || [],
              image_url
            })
          })
          resultData = result?.data || result
          // Make sure image_url is returned/attached if not returned by the API
          if (resultData && !resultData.image_url) {
            resultData.image_url = image_url
          }
        } catch (fetchErr: any) {
          console.warn('[mkt360-api] Erro ao comunicar com GoTicket, acionando fallback mock:', fetchErr.message)
          const mockEventId = Math.floor(100000 + Math.random() * 900000)
          resultData = {
            success: true,
            event_id: mockEventId,
            title,
            description,
            location,
            date,
            image_url,
            is_mock: true,
            ticket_types: (ticket_types || []).map((t: any, index: number) => ({
              id: `tkt_type_${index}_${Date.now()}`,
              name: t.name || 'Geral',
              price: t.price || '0',
              quantity: t.quantity || 100,
              description: t.description || ''
            }))
          }
        }
      }

      return new Response(JSON.stringify(resultData), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error(`Ação '${action}' desconhecida.`)

  } catch (error: any) {
    console.error(`[mkt360-api] Erro:`, error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
