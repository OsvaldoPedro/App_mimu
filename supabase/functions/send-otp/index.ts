import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** Gera hash SHA-256 de um texto */
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Normaliza número angolano para formato 244XXXXXXXXX */
function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('244') && digits.length === 12) return digits
  if (digits.length === 9) return `244${digits}`
  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    // ── Leitura do body ──────────────────────────────────────────────────────
    let rawBody: Record<string, unknown>
    try {
      rawBody = await req.json()
    } catch {
      return json({ error: 'Body JSON inválido.' }, 400)
    }

    const { phone: rawPhone } = rawBody as { phone?: string }

    if (!rawPhone) {
      return json({ error: 'O campo "phone" é obrigatório.' }, 400)
    }

    const phone = normalizePhone(rawPhone)
    if (!phone) {
      return json({ error: 'Formato de telefone inválido. Use 9 dígitos ou 244XXXXXXXXX.' }, 400)
    }

    // ── Supabase Admin ───────────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // ── Rate limit: 1 envio por minuto ───────────────────────────────────────
    const { data: recent } = await supabase
      .from('otp_codes')
      .select('created_at')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (recent) {
      const diffMs = Date.now() - new Date(recent.created_at).getTime()
      if (diffMs < 60_000) {
        const waitSecs = Math.ceil((60_000 - diffMs) / 1000)
        return json(
          { error: `Aguarde ${waitSecs}s antes de pedir novo código.`, wait_seconds: waitSecs },
          429
        )
      }
    }

    // ── Gerar código ─────────────────────────────────────────────────────────
    const code = Math.floor(100_000 + Math.random() * 900_000).toString()
    const hashedCode = await sha256(code)
    const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString()

    // ── Apagar OTPs anteriores do mesmo número ───────────────────────────────
    await supabase.from('otp_codes').delete().eq('phone', phone)

    // ── Guardar na BD ─────────────────────────────────────────────────────────
    const { error: dbError } = await supabase.from('otp_codes').insert({
      phone,
      code: hashedCode,
      expires_at: expiresAt,
      attempts: 0,
      verified: false,
    })

    if (dbError) {
      console.error('[send-otp] DB insert error:', dbError)
      throw new Error('Erro ao guardar o código. Tente novamente.')
    }

    // ── Enviar SMS via CastBrick ─────────────────────────────────────────────
    const CASTBRICK_API_KEY = Deno.env.get('CASTBRICK_API_KEY')

    if (!CASTBRICK_API_KEY) {
      // Em desenvolvimento sem chave: simular envio e retornar o código nos logs
      console.warn(`[send-otp] CASTBRICK_API_KEY não configurada. CÓDIGO SIMULADO: ${code}`)
      return json({ success: true, message: 'Código enviado (modo simulado).', _dev_code: code })
    }

    const smsMessage = `[Mimu] O seu codigo de verificacao e: ${code}. Valido por 5 minutos. Nao partilhe este codigo.`

    const smsRes = await fetch('https://api.castbrick.com/api/v1/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CASTBRICK_API_KEY}`,
      },
      body: JSON.stringify({
        to: phone,
        message: smsMessage,
        sender_id: 'Mimu',
      }),
    })

    if (!smsRes.ok) {
      const errBody = await smsRes.text()
      console.error('[send-otp] CastBrick error:', smsRes.status, errBody)
      // Apagar o OTP guardado se o SMS falhou (para evitar estados inconsistentes)
      await supabase.from('otp_codes').delete().eq('phone', phone)
      throw new Error(`Falha ao enviar SMS (${smsRes.status}). Verifique o número e tente novamente.`)
    }

    console.log(`[send-otp] SMS enviado para ${phone}`)
    return json({ success: true, message: 'Código SMS enviado com sucesso.' })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.'
    console.error('[send-otp] Erro:', message)
    return json({ error: message }, 500)
  }
})
