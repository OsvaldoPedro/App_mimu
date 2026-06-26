import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// =========================================================================
// Helper: obter cliente Supabase (admin) e cliente autenticado do utilizador
// =========================================================================
function buildClients(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

  const authHeader = req.headers.get('Authorization') ?? ''
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  })
  return { supabaseAdmin, supabaseUser }
}

// Helper: gerar referência única para transação
function generateRef(prefix = 'WLT') {
  return `${prefix}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
}

// Helper: criar carteira automaticamente se não existir
async function ensureWallet(supabaseAdmin: ReturnType<typeof createClient>, userId: string) {
  const { data: wallet, error } = await supabaseAdmin
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(`Erro ao buscar carteira: ${error.message}`)

  if (!wallet) {
    const { data: created, error: createErr } = await supabaseAdmin
      .from('wallets')
      .insert({ user_id: userId, balance: 0, currency: 'AOA', is_active: true })
      .select()
      .single()
    if (createErr) throw new Error(`Erro ao criar carteira: ${createErr.message}`)
    return created
  }

  return wallet
}

// =========================================================================
// Main Handler
// =========================================================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { supabaseAdmin, supabaseUser } = buildClients(req)

    // Verificar autenticação do utilizador
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autenticado.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { action, data } = body

    if (!action) {
      return new Response(JSON.stringify({ error: 'Parâmetro action é obrigatório.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[wallet-api] Utilizador ${user.id} - Ação: ${action}`)

    // =========================================================================
    // AÇÃO: get-wallet — Obter saldo e informação da carteira
    // =========================================================================
    if (action === 'get-wallet') {
      const wallet = await ensureWallet(supabaseAdmin, user.id)

      return new Response(JSON.stringify({ success: true, wallet }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // =========================================================================
    // AÇÃO: get-history — Histórico de transações
    // =========================================================================
    if (action === 'get-history') {
      const { page = 1, limit = 20, type = null } = data || {}
      const offset = (page - 1) * limit

      let query = supabaseAdmin
        .from('wallet_transactions')
        .select('*, related_user:related_user_id(id, full_name, avatar_url)', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (type) {
        query = query.eq('type', type)
      }

      const { data: transactions, count, error: txErr } = await query

      if (txErr) throw new Error(`Erro ao buscar histórico: ${txErr.message}`)

      return new Response(JSON.stringify({
        success: true,
        transactions: transactions || [],
        total: count || 0,
        page,
        limit
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // =========================================================================
    // AÇÃO: deposit — Depositar via Appy Pay
    // =========================================================================
    if (action === 'deposit') {
      const { amount, payment_method } = data || {}

      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Montante de depósito inválido.')
      }
      if (!payment_method) {
        throw new Error('Método de pagamento é obrigatório.')
      }

      const cleanAmount = parseFloat(amount)
      const wallet = await ensureWallet(supabaseAdmin, user.id)

      // Configurações Appy Pay
      const APPY_PAY_CLIENT_ID = Deno.env.get('APPY_PAY_CLIENT_ID')
      const APPY_PAY_CLIENT_SECRET = Deno.env.get('APPY_PAY_CLIENT_SECRET')
      const APPY_PAY_BASE_URL = Deno.env.get('APPY_PAY_BASE_URL') ?? 'https://gwy-api-tst.appypay.co.ao/v2.0'
      const APPY_PAY_AUTH_URL = Deno.env.get('APPY_PAY_AUTH_URL') ?? 'https://auth.appypay.co.ao/connect/token'
      const useMock = !APPY_PAY_CLIENT_ID || APPY_PAY_CLIENT_ID === 'mock' || !APPY_PAY_CLIENT_SECRET || APPY_PAY_CLIENT_SECRET === 'mock'

      const reference = generateRef('DEP')
      let transactionId = ''
      let paymentUrl = ''

      if (useMock) {
        transactionId = `mock_dep_${Math.random().toString(36).substring(2, 11)}`
        paymentUrl = `https://checkout-tst.appypay.co.ao/pay/${transactionId}`
      } else {
        // Obter token OAuth
        const tokenRes = await fetch(APPY_PAY_AUTH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
          body: new URLSearchParams({
            client_id: APPY_PAY_CLIENT_ID!,
            client_secret: APPY_PAY_CLIENT_SECRET!,
            grant_type: 'client_credentials'
          }).toString()
        })
        if (!tokenRes.ok) throw new Error('Falha ao autenticar com Appy Pay.')
        const tokenData = await tokenRes.json()
        const token = tokenData.access_token

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const chargeRes = await fetch(`${APPY_PAY_BASE_URL}/charges`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: cleanAmount,
            currency: 'AOA',
            reference,
            description: `Depósito Carteira Mimu - Ref ${reference}`,
            payment_method: payment_method === 'multicaixa_express' ? 'gpo' : 'ref',
            callback_url: `${supabaseUrl}/functions/v1/appy-pay-webhook`
          })
        })
        if (!chargeRes.ok) throw new Error('Erro ao criar cobrança no Appy Pay.')
        const chargeData = await chargeRes.json()
        transactionId = chargeData.id ?? chargeData.transaction_id
        paymentUrl = chargeData.payment_url ?? ''
      }

      // Registar pagamento pendente
      const { data: payment, error: payErr } = await supabaseAdmin
        .from('payments')
        .insert({
          user_id: user.id,
          amount: cleanAmount,
          currency: 'AOA',
          payment_method,
          transaction_reference: reference,
          transaction_id: transactionId,
          status: 'pending',
          metadata: {
            type: 'wallet_deposit',
            wallet_id: wallet.id,
            payment_url: paymentUrl
          }
        })
        .select()
        .single()

      if (payErr) throw new Error(`Erro ao registar pagamento: ${payErr.message}`)

      // Registar transação de depósito pendente
      const { error: txErr } = await supabaseAdmin
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: user.id,
          type: 'deposit',
          amount: cleanAmount,
          balance_before: wallet.balance,
          balance_after: wallet.balance, // será atualizado no webhook
          status: 'pending',
          reference,
          description: `Depósito via ${payment_method === 'multicaixa_express' ? 'Multicaixa Express' : 'Referência'}`,
          metadata: { payment_id: payment.id, transaction_id: transactionId },
          related_payment_id: payment.id
        })

      if (txErr) {
        console.error('[wallet-api] Erro ao registar transação pendente:', txErr)
      }

      return new Response(JSON.stringify({
        success: true,
        reference,
        transaction_id: transactionId,
        payment_id: payment.id,
        amount: cleanAmount,
        payment_url: paymentUrl,
        payment_method
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // =========================================================================
    // AÇÃO: withdrawal — Solicitar levantamento
    // =========================================================================
    if (action === 'withdrawal') {
      const { amount, iban, account_name, phone } = data || {}

      if (!amount || parseFloat(amount) <= 0) throw new Error('Montante inválido.')
      const cleanAmount = parseFloat(amount)
      const MIN_WITHDRAWAL = 500

      if (cleanAmount < MIN_WITHDRAWAL) {
        throw new Error(`O montante mínimo de levantamento é ${MIN_WITHDRAWAL} AOA.`)
      }

      const wallet = await ensureWallet(supabaseAdmin, user.id)

      if (wallet.balance < cleanAmount) {
        throw new Error(`Saldo insuficiente. Saldo atual: ${wallet.balance} AOA.`)
      }

      if (!wallet.is_active) throw new Error('Carteira bloqueada. Contacte o suporte.')

      const reference = generateRef('WTH')

      // Debitar saldo imediatamente (levantamento fica pendente para processamento manual/API)
      const newBalance = parseFloat((wallet.balance - cleanAmount).toFixed(2))

      const { error: updateErr } = await supabaseAdmin
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id)

      if (updateErr) throw new Error(`Erro ao atualizar saldo: ${updateErr.message}`)

      // Registar transação
      const { error: txErr } = await supabaseAdmin
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: user.id,
          type: 'withdrawal',
          amount: cleanAmount,
          balance_before: wallet.balance,
          balance_after: newBalance,
          status: 'pending',
          reference,
          description: `Levantamento solicitado - ${iban ? `IBAN: ${iban}` : `Tel: ${phone}`}`,
          metadata: { iban, account_name, phone }
        })

      if (txErr) {
        // Reverter débito em caso de falha
        await supabaseAdmin.from('wallets').update({ balance: wallet.balance }).eq('id', wallet.id)
        throw new Error(`Erro ao registar levantamento: ${txErr.message}`)
      }

      // Notificação ao utilizador
      await supabaseAdmin.from('notifications').insert({
        user_id: user.id,
        title: 'Levantamento Solicitado',
        message: `O seu pedido de levantamento de ${cleanAmount.toFixed(2)} AOA foi recebido. Referência: ${reference}. Será processado em 1-2 dias úteis.`,
        read: false
      })

      return new Response(JSON.stringify({
        success: true,
        reference,
        amount: cleanAmount,
        new_balance: newBalance,
        status: 'pending',
        message: 'Levantamento solicitado com sucesso. Será processado em 1-2 dias úteis.'
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // =========================================================================
    // AÇÃO: transfer — Transferir para outro utilizador
    // =========================================================================
    if (action === 'transfer') {
      const { amount, recipient_email, recipient_id, note } = data || {}

      if (!amount || parseFloat(amount) <= 0) throw new Error('Montante inválido.')
      if (!recipient_email && !recipient_id) throw new Error('Email ou ID do destinatário é obrigatório.')

      const cleanAmount = parseFloat(amount)
      const MIN_TRANSFER = 100

      if (cleanAmount < MIN_TRANSFER) {
        throw new Error(`O montante mínimo de transferência é ${MIN_TRANSFER} AOA.`)
      }

      // Obter carteira do remetente
      const senderWallet = await ensureWallet(supabaseAdmin, user.id)

      if (!senderWallet.is_active) throw new Error('Carteira bloqueada. Contacte o suporte.')
      if (senderWallet.balance < cleanAmount) {
        throw new Error(`Saldo insuficiente. Saldo atual: ${senderWallet.balance.toFixed(2)} AOA.`)
      }

      // Encontrar destinatário
      let recipientUser = null
      if (recipient_id) {
        const { data: rUser } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', recipient_id)
          .maybeSingle()
        recipientUser = rUser
      } else {
        const { data: rUser } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email')
          .eq('email', recipient_email)
          .maybeSingle()
        recipientUser = rUser
      }

      if (!recipientUser) throw new Error('Destinatário não encontrado.')
      if (recipientUser.id === user.id) throw new Error('Não pode transferir para si próprio.')

      // Obter/criar carteira do destinatário
      const recipientWallet = await ensureWallet(supabaseAdmin, recipientUser.id)
      if (!recipientWallet.is_active) throw new Error('A carteira do destinatário está bloqueada.')

      const reference = generateRef('TRF')
      const senderNewBalance = parseFloat((senderWallet.balance - cleanAmount).toFixed(2))
      const recipientNewBalance = parseFloat((recipientWallet.balance + cleanAmount).toFixed(2))

      // Atualizar saldo remetente
      const { error: senderErr } = await supabaseAdmin
        .from('wallets')
        .update({ balance: senderNewBalance })
        .eq('id', senderWallet.id)
      if (senderErr) throw new Error(`Erro ao debitar remetente: ${senderErr.message}`)

      // Atualizar saldo destinatário
      const { error: recipientErr } = await supabaseAdmin
        .from('wallets')
        .update({ balance: recipientNewBalance })
        .eq('id', recipientWallet.id)

      if (recipientErr) {
        // Reverter débito do remetente
        await supabaseAdmin.from('wallets').update({ balance: senderWallet.balance }).eq('id', senderWallet.id)
        throw new Error(`Erro ao creditar destinatário: ${recipientErr.message}`)
      }

      // Registar transação saída (remetente)
      await supabaseAdmin.from('wallet_transactions').insert({
        wallet_id: senderWallet.id,
        user_id: user.id,
        type: 'transfer_out',
        amount: cleanAmount,
        balance_before: senderWallet.balance,
        balance_after: senderNewBalance,
        status: 'completed',
        reference,
        description: note || `Transferência para ${recipientUser.full_name || recipientUser.email}`,
        metadata: { recipient_id: recipientUser.id, recipient_name: recipientUser.full_name },
        related_user_id: recipientUser.id
      })

      // Registar transação entrada (destinatário)
      await supabaseAdmin.from('wallet_transactions').insert({
        wallet_id: recipientWallet.id,
        user_id: recipientUser.id,
        type: 'transfer_in',
        amount: cleanAmount,
        balance_before: recipientWallet.balance,
        balance_after: recipientNewBalance,
        status: 'completed',
        reference,
        description: note || `Transferência recebida`,
        metadata: { sender_id: user.id },
        related_user_id: user.id
      })

      // Notificações
      const { data: senderProfile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()

      await supabaseAdmin.from('notifications').insert({
        user_id: recipientUser.id,
        title: '💸 Transferência Recebida',
        message: `Recebeu ${cleanAmount.toFixed(2)} AOA de ${senderProfile?.full_name || 'um utilizador'}. Referência: ${reference}`,
        read: false
      })

      return new Response(JSON.stringify({
        success: true,
        reference,
        amount: cleanAmount,
        new_balance: senderNewBalance,
        recipient: { id: recipientUser.id, name: recipientUser.full_name },
        message: `Transferência de ${cleanAmount.toFixed(2)} AOA enviada com sucesso.`
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // =========================================================================
    // AÇÃO: pay-internal — Pagar um serviço/bilhete usando saldo da carteira
    // =========================================================================
    if (action === 'pay-internal') {
      const { amount, description, service_id, event_id, metadata: payMeta } = data || {}

      if (!amount || parseFloat(amount) <= 0) throw new Error('Montante inválido.')

      const cleanAmount = parseFloat(amount)
      const wallet = await ensureWallet(supabaseAdmin, user.id)

      if (!wallet.is_active) throw new Error('Carteira bloqueada. Contacte o suporte.')
      if (wallet.balance < cleanAmount) {
        throw new Error(`Saldo insuficiente. Saldo atual: ${wallet.balance.toFixed(2)} AOA.`)
      }

      const reference = generateRef('PAY')
      const newBalance = parseFloat((wallet.balance - cleanAmount).toFixed(2))

      // Debitar saldo
      const { error: updateErr } = await supabaseAdmin
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id)

      if (updateErr) throw new Error(`Erro ao debitar saldo: ${updateErr.message}`)

      // Registar pagamento como 'paid' diretamente
      const { data: payment, error: payErr } = await supabaseAdmin
        .from('payments')
        .insert({
          user_id: user.id,
          service_id: service_id || null,
          event_id: event_id || null,
          amount: cleanAmount,
          currency: 'AOA',
          payment_method: 'wallet',
          transaction_reference: reference,
          transaction_id: reference,
          status: 'paid',
          paid_at: new Date().toISOString(),
          metadata: { ...payMeta, wallet_payment: true }
        })
        .select()
        .single()

      if (payErr) {
        await supabaseAdmin.from('wallets').update({ balance: wallet.balance }).eq('id', wallet.id)
        throw new Error(`Erro ao registar pagamento: ${payErr.message}`)
      }

      // Registar transação na carteira
      await supabaseAdmin.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        user_id: user.id,
        type: 'payment',
        amount: cleanAmount,
        balance_before: wallet.balance,
        balance_after: newBalance,
        status: 'completed',
        reference,
        description: description || 'Pagamento via carteira',
        metadata: { payment_id: payment.id, service_id, event_id },
        related_payment_id: payment.id
      })

      return new Response(JSON.stringify({
        success: true,
        reference,
        payment_id: payment.id,
        amount: cleanAmount,
        new_balance: newBalance,
        status: 'paid'
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: `Ação '${action}' desconhecida.` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error(`[wallet-api] Erro geral:`, error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
