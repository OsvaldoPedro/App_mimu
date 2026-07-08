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
    let rawBody: Record<string, unknown>
    try {
      rawBody = await req.json()
    } catch {
      return json({ error: 'Body JSON inválido.' }, 400)
    }

    const { phone: rawPhone, code } = rawBody as { phone?: string; code?: string }

    if (!rawPhone || !code) {
      return json({ error: 'Os campos "phone" e "code" são obrigatórios.' }, 400)
    }

    const phone = normalizePhone(rawPhone)
    if (!phone) {
      return json({ error: 'Formato de telefone inválido.' }, 400)
    }

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return json({ error: 'O código de verificação deve ter 6 dígitos numéricos.' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar o OTP ativo da base de dados
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('verified', false)
      .single()

    if (fetchError || !otpRecord) {
      return json({ error: 'Código de verificação não encontrado ou já utilizado.' }, 400)
    }

    // Verificar expiração
    if (new Date() > new Date(otpRecord.expires_at)) {
      await supabase.from('otp_codes').delete().eq('id', otpRecord.id)
      return json({ error: 'O código de verificação expirou. Peça um novo.' }, 400)
    }

    // Verificar limite de tentativas
    const currentAttempts = otpRecord.attempts || 0
    if (currentAttempts >= 5) {
      await supabase.from('otp_codes').delete().eq('id', otpRecord.id)
      return json({ error: 'Limite de tentativas de verificação excedido. Peça um novo código.' }, 429)
    }

    // Comparar hashes
    const hashedInput = await sha256(code)
    if (hashedInput !== otpRecord.code) {
      const nextAttempts = currentAttempts + 1
      
      if (nextAttempts >= 5) {
        await supabase.from('otp_codes').delete().eq('id', otpRecord.id)
        return json({ error: 'Código incorreto. Limite de tentativas excedido. Peça um novo código.' }, 429)
      } else {
        await supabase
          .from('otp_codes')
          .update({ attempts: nextAttempts })
          .eq('id', otpRecord.id)

        const remaining = 5 - nextAttempts
        return json({ error: `Código incorreto. Resta(m) ${remaining} tentativa(s).` }, 400)
      }
    }

    // Código correto: marcar como verificado
    const { error: updateError } = await supabase
      .from('otp_codes')
      .update({ verified: true })
      .eq('id', otpRecord.id)

    if (updateError) {
      throw new Error('Erro ao atualizar o estado de verificação.')
    }

    return json({ success: true, message: 'Número de telefone verificado com sucesso.' })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.'
    console.error('[verify-verification-code] Erro:', message)
    return json({ error: message }, 500)
  }
})
